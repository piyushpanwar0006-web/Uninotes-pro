import { createAdminClient } from '@/lib/supabase/admin';
import { STORAGE_BUCKET } from '@/types/upload';
import { log } from '@/lib/logger';

export interface CleanupResult {
  softDeletesProcessed: number;
  storageFilesDeleted: number;
  dbRecordsHardDeleted: number;
  orphansFound: number;
  orphansDeleted: number;
  errors: string[];
}

/**
 * Service for background system maintenance.
 * Designed to be called by a secure Cron API endpoint.
 */
export class MaintenanceService {
  /**
   * Job 1: The Reaper
   * Processes soft-deleted records: deletes storage files and hard-deletes DB rows.
   */
  static async processSoftDeletes(batchSize = 50): Promise<Partial<CleanupResult>> {
    const admin = createAdminClient();
    const result: Partial<CleanupResult> = {
      softDeletesProcessed: 0,
      storageFilesDeleted: 0,
      dbRecordsHardDeleted: 0,
      errors: [],
    };

    const { data: softDeleted, error } = await admin
      .from('papers')
      .select('id, storage_path')
      .not('deleted_at', 'is', null)
      .limit(batchSize);

    if (error) {
      result.errors?.push(`Failed to fetch soft-deleted papers: ${error.message}`);
      return result;
    }

    for (const paper of softDeleted) {
      try {
        let storageSuccess = true;

        if (paper.storage_path) {
          const { error: storageErr } = await admin.storage
            .from(STORAGE_BUCKET)
            .remove([paper.storage_path]);

          if (storageErr) {
            // NoSuchKey means it's already gone, which is a "success" for cleanup purposes
            if (!storageErr.message.includes('not found') && !storageErr.message.includes('NoSuchKey')) {
              storageSuccess = false;
              result.errors?.push(`Storage delete failed for ${paper.id}: ${storageErr.message}`);
            }
          } else {
            result.storageFilesDeleted!++;
          }
        }

        if (storageSuccess) {
          const { error: dbErr } = await admin.from('papers').delete().eq('id', paper.id);
          if (dbErr) {
            result.errors?.push(`DB hard-delete failed for ${paper.id}: ${dbErr.message}`);
          } else {
            result.dbRecordsHardDeleted!++;
          }
        }
        result.softDeletesProcessed!++;
      } catch (ex: any) {
        result.errors?.push(`Unexpected error processing paper ${paper.id}: ${ex.message}`);
      }
    }

    return result;
  }

  /**
   * Job 2: The Scanner
   * Scans storage for files that don't have a matching DB record.
   * NOTE: Only deletes files older than 2 hours to avoid race conditions with active uploads.
   */
  static async cleanupOrphanFiles(): Promise<Partial<CleanupResult>> {
    const admin = createAdminClient();
    const result: Partial<CleanupResult> = { orphansFound: 0, orphansDeleted: 0, errors: [] };

    try {
      // 1. List all top-level folders (user IDs)
      const { data: folders, error: folderErr } = await admin.storage.from(STORAGE_BUCKET).list();
      if (folderErr) throw folderErr;

      for (const folder of folders || []) {
        if (!folder.id) continue; // Skip files at root if any

        // 2. List files in each user folder
        const { data: files, error: fileErr } = await admin.storage
          .from(STORAGE_BUCKET)
          .list(folder.name);
        
        if (fileErr) {
          result.errors?.push(`Failed to list folder ${folder.name}: ${fileErr.message}`);
          continue;
        }

        for (const file of files || []) {
          const storagePath = `${folder.name}/${file.name}`;
          
          if (!file.created_at) continue;
          const isOld = new Date().getTime() - new Date(file.created_at).getTime() > 2 * 60 * 60 * 1000;
          if (!isOld) continue;

          // 3. Check DB for matching storage_path
          const { data: paper, error: dbErr } = await admin
            .from('papers')
            .select('id')
            .eq('storage_path', storagePath)
            .maybeSingle();

          if (dbErr) {
            result.errors?.push(`DB check failed for ${storagePath}: ${dbErr.message}`);
            continue;
          }

          if (!paper) {
            // ORPHAN DETECTED!
            result.orphansFound!++;
            const { error: delErr } = await admin.storage.from(STORAGE_BUCKET).remove([storagePath]);
            if (delErr) {
              result.errors?.push(`Failed to delete orphan ${storagePath}: ${delErr.message}`);
            } else {
              result.orphansDeleted!++;
              log.info(`[Cleanup] Deleted orphan file: ${storagePath}`);
            }
          }
        }
      }
    } catch (ex: any) {
      result.errors?.push(`Scanner job failed: ${ex.message}`);
    }

    return result;
  }

  /**
   * Job 3: The Aggregator
   * Calculates trending scores based on the last 7 days of downloads.
   */
  static async aggregateAnalytics(): Promise<{ processed: number; errors: string[] }> {
    const admin = createAdminClient();
    const result = { processed: 0, errors: [] as string[] };

    try {
      // Fetch download counts for the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await admin
        .from('resource_downloads')
        .select('resource_id')
        .eq('resource_type', 'paper')
        .gte('created_at', sevenDaysAgo);

      if (error) throw error;

      // Group counts by resource_id
      const counts: Record<string, number> = {};
      data?.forEach((d) => {
        counts[d.resource_id] = (counts[d.resource_id] || 0) + 1;
      });

      // Update papers with trending scores
      for (const [paperId, score] of Object.entries(counts)) {
        const { error: upErr } = await admin
          .from('papers')
          .update({ trending_score: score })
          .eq('id', paperId);

        if (upErr) {
          result.errors.push(`Failed to update score for ${paperId}: ${upErr.message}`);
        } else {
          result.processed++;
        }
      }
    } catch (ex: any) {
      result.errors.push(`Aggregator job failed: ${ex.message}`);
    }

    return result;
  }
}
