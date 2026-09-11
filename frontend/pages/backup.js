import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import {
  Database,
  Download,
  Upload,
  Calendar,
  Clock,
  HardDrive,
  Trash2,
  RefreshCw,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      const [backupsData, scheduleData] = await Promise.all([
        apiGet('/backup/list'),
        apiGet('/backup/schedule'),
      ]);

      setBackups(backupsData.backups || []);
      setSchedule(scheduleData.schedule);
    } catch (error) {
      console.error('Failed to load backup data', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      await apiPost('/backup/create');
      toast.success('Backup created successfully');
      loadBackupData();
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      return;
    }

    setRestoring(backupId);
    try {
      await apiPost(`/backup/restore/${backupId}`);
      toast.success('Backup restored successfully');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      await apiDelete(`/backup/${backupId}`);
      toast.success('Backup deleted');
      setBackups(backups.filter(b => b.id !== backupId));
    } catch (error) {
      toast.error('Failed to delete backup');
    }
  };

  const scheduleBackup = async (frequency) => {
    try {
      await apiPost('/backup/schedule', { frequency });
      toast.success(`Backup scheduled: ${frequency}`);
      loadBackupData();
    } catch (error) {
      toast.error('Failed to schedule backup');
    }
  };

  const disableSchedule = async () => {
    try {
      await apiPut('/backup/schedule/disable');
      toast.success('Backup schedule disabled');
      loadBackupData();
    } catch (error) {
      toast.error('Failed to disable schedule');
    }
  };

  const cleanupOldBackups = async () => {
    if (!confirm('Are you sure you want to delete backups older than 30 days?')) {
      return;
    }

    try {
      await apiPost('/backup/cleanup', { retentionDays: 30 });
      toast.success('Old backups cleaned up');
      loadBackupData();
    } catch (error) {
      toast.error('Failed to cleanup backups');
    }
  };

  if (loading) {
    return (
      <Layout title="Backup & Restore">
        <div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Backup & Restore">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={createBackup}
            disabled={creating}
            className="bg-ground-secondary border hairline rounded-xl p-5 hover:border-amber transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-5 h-5 text-amber" />
              <span className="portal-heading">Create Backup</span>
            </div>
            <p className="portal-label text-muted">Create a new database backup</p>
          </button>

          <button
            onClick={cleanupOldBackups}
            className="bg-ground-secondary border hairline rounded-xl p-5 hover:border-amber transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span className="portal-heading">Cleanup Old</span>
            </div>
            <p className="portal-label text-muted">Delete backups older than 30 days</p>
          </button>

          <button
            onClick={loadBackupData}
            className="bg-ground-secondary border hairline rounded-xl p-5 hover:border-amber transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-5 h-5 text-teal" />
              <span className="portal-heading">Refresh</span>
            </div>
            <p className="portal-label text-muted">Reload backup list</p>
          </button>
        </div>

        {/* Backup Schedule */}
        <div className="bg-ground-secondary border hairline rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber/15 flex items-center justify-center">
              <Settings className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h3 className="portal-heading text-lg">Backup Schedule</h3>
              <p className="portal-label text-muted">Automated backup configuration</p>
            </div>
          </div>

          {schedule && schedule.status === 'active' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-ground rounded-lg border hairline">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-teal" />
                  <div>
                    <p className="portal-label font-semibold">Scheduled: {schedule.frequency}</p>
                    {schedule.last_run_at && (
                      <p className="portal-label text-muted text-sm">
                        Last run: {new Date(schedule.last_run_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={disableSchedule}
                  className="px-3 py-1.5 bg-red-400/20 text-red-400 rounded-lg portal-label font-semibold hover:bg-red-400/30"
                >
                  Disable
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="portal-label text-muted">No active schedule</p>
              <div className="flex gap-3">
                <button
                  onClick={() => scheduleBackup('daily')}
                  className="px-4 py-2 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90"
                >
                  Daily
                </button>
                <button
                  onClick={() => scheduleBackup('weekly')}
                  className="px-4 py-2 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90"
                >
                  Weekly
                </button>
                <button
                  onClick={() => scheduleBackup('monthly')}
                  className="px-4 py-2 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90"
                >
                  Monthly
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Backup List */}
        <div className="bg-ground-secondary border hairline rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center">
              <Database className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h3 className="portal-heading text-lg">Available Backups</h3>
              <p className="portal-label text-muted">{backups.length} backup(s)</p>
            </div>
          </div>

          {backups.length === 0 ? (
            <p className="portal-label text-muted py-8 text-center">No backups available</p>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 bg-ground rounded-lg border hairline"
                >
                  <div className="flex items-center gap-4">
                    <HardDrive className="w-5 h-5 text-muted" />
                    <div>
                      <p className="portal-label font-semibold">{backup.filename}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="portal-label text-muted flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(backup.created_at).toLocaleDateString()}
                        </span>
                        <span className="portal-label text-muted flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(backup.created_at).toLocaleTimeString()}
                        </span>
                        <span className="portal-label text-muted">{backup.file_size}</span>
                        {backup.last_restored_at && (
                          <span className="portal-label text-teal text-sm">
                            Restored: {new Date(backup.last_restored_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreBackup(backup.id)}
                      disabled={restoring === backup.id}
                      className="p-2 text-teal hover:bg-teal/10 rounded-lg disabled:opacity-50"
                      title="Restore"
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
