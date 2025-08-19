import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, Stack, Alert, CircularProgress, Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { ArrowBack, Place, AccessTime, Info } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchReportById, selectCurrentReport, selectReportsLoading, selectReportsError, approveReport, rejectReport, selectReportsUpdating, startReviewReport, fetchReportEvents, selectReportEvents, fetchReportComments, selectReportComments, addReportComment } from '../../store/slices/reportsSlice';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { APP_CONFIG } from '../../config/app.config';
import { formatViolationType, formatReportStatus } from '../../shared/utils/formatting';

const backendOrigin = (() => {
  try {
    const u = new URL(APP_CONFIG.api.baseUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'http://localhost:3000';
  }
})();

const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path) return null;
  try {
    return new URL(path, backendOrigin).toString();
  } catch {
    return null;
  }
};

const inferVideoMimeType = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.avi')) return 'video/x-msvideo';
  return 'video/mp4';
};

const ReportDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const report = useAppSelector(selectCurrentReport);
  const isLoading = useAppSelector(selectReportsLoading);
  const error = useAppSelector(selectReportsError);
  const isUpdating = useAppSelector(selectReportsUpdating);
  const events = useAppSelector((s) => selectReportEvents(s as any, Number(id)));
  const comments = useAppSelector((s) => selectReportComments(s as any, Number(id)));
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchReportById(Number(id)));
      dispatch(fetchReportEvents(Number(id)));
      dispatch(fetchReportComments(Number(id)));
    }
  }, [dispatch, id]);

  // When the report is fetched and is pending, set it to UNDER_REVIEW (once per view)
  useEffect(() => {
    const reportId = Number(id);
    if (!reportId || !report) return;
    const currentStatus = String((report as any)?.status || '').toUpperCase();
    // Prevent duplicate trigger on re-renders
    const triggeredKey = `__rvv_review_triggered_${reportId}`;
    const alreadyTriggered = (window as any)[triggeredKey] === true;
    if (currentStatus === 'PENDING' && !alreadyTriggered) {
      (window as any)[triggeredKey] = true;
      dispatch(startReviewReport(reportId));
    }
  }, [dispatch, id, report]);
  useEffect(() => {
    if (report) {
      try {
        console.log('[ReportDetailPage] Report payload:', report);
        console.log('[ReportDetailPage] mediaMetadata:', (report as any)?.media?.mediaMetadata ?? (report as any)?.mediaMetadata ?? null);
      } catch {
        // no-op
      }
    }
  }, [report]);

  const rawPhoto = useMemo(() => {
    const anyReport = report as any;
    return report?.media?.photoUri || anyReport?.photoUrl || anyReport?.photoURI || null;
  }, [report]);

  const rawVideo = useMemo(() => {
    const anyReport = report as any;
    return report?.media?.videoUri || anyReport?.videoUrl || anyReport?.videoURI || null;
  }, [report]);

  const photoUrl = useMemo(() => resolveMediaUrl(rawPhoto || undefined), [rawPhoto]);
  const videoUrl = useMemo(() => resolveMediaUrl(rawVideo || undefined), [rawVideo]);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [approveChallanIssued, setApproveChallanIssued] = useState(true);
  const [approveChallanNumber, setApproveChallanNumber] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  // Initialize previews to direct URLs
  useEffect(() => {
    setPhotoPreview(photoUrl || null);
    return () => {
      setPhotoPreview(prev => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [photoUrl]);

  useEffect(() => {
    setVideoPreview(videoUrl || null);
    setIsVideoLoading(!!videoUrl);
    return () => {
      setVideoPreview(prev => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
      setIsVideoLoading(false);
    };
  }, [videoUrl]);

  const fetchBlobFallback = useCallback(async (url: string, setPreview: (u: string) => void) => {
    try {
      setIsVideoLoading(true);
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) return;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreview(objectUrl);
      // keep loading true; will turn false on canplay/loadeddata
    } catch {
      setIsVideoLoading(false);
    }
  }, []);

  const normalizedLocation = useMemo(() => {
    const anyReport = report as any;
    const loc = (report as any)?.location || {};
    const address = loc.address || anyReport?.address || '';
    const city = loc.city || anyReport?.city || '';
    const district = loc.district || anyReport?.district || '';
    const state = loc.state || anyReport?.state || '';
    const pincode = loc.pincode || anyReport?.pincode || '';
    const latRaw = loc.latitude ?? anyReport?.latitude ?? loc.lat ?? anyReport?.lat;
    const lngRaw = loc.longitude ?? anyReport?.longitude ?? loc.lng ?? anyReport?.lng;
    const latitude = latRaw !== undefined && latRaw !== null && latRaw !== '' ? parseFloat(String(latRaw)) : undefined;
    const longitude = lngRaw !== undefined && lngRaw !== null && lngRaw !== '' ? parseFloat(String(lngRaw)) : undefined;
    return { address, city, district, state, pincode, latitude, longitude } as {
      address?: string; city?: string; district?: string; state?: string; pincode?: string; latitude?: number; longitude?: number;
    };
  }, [report]);

  const center = useMemo<[number, number]>(() => {
    const { latitude, longitude } = normalizedLocation;
    if (typeof latitude === 'number' && !Number.isNaN(latitude) && typeof longitude === 'number' && !Number.isNaN(longitude)) {
      return [latitude, longitude];
    }
    return [20.5937, 78.9629];
  }, [normalizedLocation]);

  const violationTypes = useMemo(() => {
    const anyReport: any = report as any;
    const collected: string[] = [];
    const rawMeta = anyReport?.media?.mediaMetadata ?? anyReport?.mediaMetadata;

    const pushAll = (values: unknown) => {
      if (Array.isArray(values)) {
        values.forEach(v => {
          const s = String(v).trim();
          if (s) collected.push(s);
        });
      }
    };

    const tryParseJson = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    if (Array.isArray(rawMeta)) {
      pushAll(rawMeta);
    } else if (rawMeta && typeof rawMeta === 'object') {
      const metaObj: any = rawMeta as any;
      if (Array.isArray(metaObj.violationTypes)) {
        pushAll(metaObj.violationTypes);
      } else if (Array.isArray(metaObj.violations)) {
        pushAll(metaObj.violations);
      } else if (Array.isArray(metaObj.types)) {
        pushAll(metaObj.types);
      } else {
        const truthyKeys = Object.keys(metaObj).filter(k => metaObj[k]);
        if (truthyKeys.length) {
          truthyKeys.forEach(k => collected.push(String(k)));
        }
      }
    } else if (typeof rawMeta === 'string' && rawMeta.trim()) {
      const trimmed = rawMeta.trim();
      const json = tryParseJson(trimmed);
      if (json && typeof json === 'object') {
        const metaObj: any = json as any;
        if (Array.isArray(metaObj.violationTypes)) {
          pushAll(metaObj.violationTypes);
        } else if (Array.isArray(metaObj.violations)) {
          pushAll(metaObj.violations);
        } else if (Array.isArray(metaObj.types)) {
          pushAll(metaObj.types);
        } else {
          const truthyKeys = Object.keys(metaObj).filter(k => metaObj[k]);
          if (truthyKeys.length) {
            truthyKeys.forEach(k => collected.push(String(k)));
          }
        }
      } else {
        const parts = trimmed.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
        pushAll(parts);
      }
    }

    const fallbackSingle = anyReport?.violationType || anyReport?.type;
    if (fallbackSingle) {
      const s = String(fallbackSingle).trim();
      if (s) collected.push(s);
    }

    return Array.from(new Set(collected));
  }, [report]);
  const approvedViolationTypesFromMeta = useMemo(() => {
    const anyReport: any = report as any;
    const collected: string[] = [];
    const rawMeta = anyReport?.media?.mediaMetadata ?? anyReport?.mediaMetadata;

    const pushAll = (values: unknown) => {
      if (Array.isArray(values)) {
        values.forEach(v => {
          const s = String(v).trim();
          if (s) collected.push(s);
        });
      }
    };

    const tryParseJson = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const normalizeValue = (val: unknown) => {
      if (Array.isArray(val)) {
        pushAll(val);
      } else if (typeof val === 'string' && val.trim()) {
        const trimmed = val.trim();
        const parsed = tryParseJson(trimmed);
        if (Array.isArray(parsed)) {
          pushAll(parsed);
        } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).approvedViolationTypes)) {
          pushAll((parsed as any).approvedViolationTypes);
        } else {
          const parts = trimmed.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
          pushAll(parts);
        }
      }
    };

    if (rawMeta && typeof rawMeta === 'object') {
      const metaObj: any = rawMeta as any;
      normalizeValue(metaObj.approvedViolationTypes);
    } else if (typeof rawMeta === 'string' && rawMeta.trim()) {
      const parsed = tryParseJson(rawMeta.trim());
      if (parsed && typeof parsed === 'object') {
        normalizeValue((parsed as any).approvedViolationTypes);
      }
    }

    // Fallback: sometimes backend may also place it at top-level
    normalizeValue(anyReport?.approvedViolationTypes);

    return Array.from(new Set(collected));
  }, [report]);
  const [approvedTypes, setApprovedTypes] = useState<string[]>([]);
  useEffect(() => {
    // Prefer approved types if already present in metadata; otherwise default to all detected types
    const source = (approvedViolationTypesFromMeta && approvedViolationTypesFromMeta.length > 0)
      ? approvedViolationTypesFromMeta
      : (violationTypes as string[]);
    setApprovedTypes(source);
  }, [violationTypes, approvedViolationTypesFromMeta]);

  const canConfirmApprove = useMemo(() => {
    const hasTypes = (approvedTypes || []).length > 0;
    const challanOk = !approveChallanIssued || approveChallanNumber.trim().length > 0;
    const notesOk = approveNotes.trim().length > 0;
    return hasTypes && challanOk && notesOk;
  }, [approvedTypes, approveChallanIssued, approveChallanNumber, approveNotes]);

  // Normalize createdAt/timestamp to ISO string for timeline reliability
  const createdAt = useMemo(() => {
    const anyReport: any = report as any;
    const raw = anyReport?.createdAt ?? anyReport?.timestamp ?? anyReport?.created_at ?? anyReport?.submittedAt;
    if (!raw) return undefined as unknown as string | undefined;
    if (raw instanceof Date) return raw.toISOString();
    const asNum = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isNaN(asNum) && String(raw).trim() !== '' && isFinite(asNum) && asNum > 0) {
      const d = new Date(asNum);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    const asStr = String(raw);
    const d2 = new Date(asStr);
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
    return undefined as unknown as string | undefined;
  }, [report]);
  const status = String((report as any)?.status || '');
  // Determine reviewer (police) name from latest status update event metadata or report fields
  const reviewerName = useMemo(() => {
    const upper = status.toUpperCase();
    const target = upper === 'APPROVED' ? 'APPROVED' : upper === 'REJECTED' ? 'REJECTED' : undefined;
    let name: string | undefined;
    if (target) {
      // Find the last STATUS_UPDATED event with this status
      const matching = (events || [])
        .filter(ev => (ev.type || '').toUpperCase() === 'STATUS_UPDATED')
        .reverse();
      for (const ev of matching) {
        try {
          const meta = ev.metadata ? JSON.parse(ev.metadata) : undefined;
          const s = String(meta?.status || '').toUpperCase();
          if (s.includes(target)) {
            name = meta?.authorName || ev.userId || undefined;
            break;
          }
        } catch {}
      }
    }
    // Fallbacks
    const anyReport: any = report as any;
    return name || anyReport?.reviewerName || anyReport?.reviewer?.name || '';
  }, [events, status, report]);

  const reviewerNotes = useMemo(() => {
    const anyReport: any = report as any;
    const candidates: Array<unknown> = [
      anyReport?.reviewNotes,
      anyReport?.reviewNote,
      anyReport?.policeNotes,
      anyReport?.notes,
      anyReport?.reason,
      anyReport?.review?.notes,
      anyReport?.review?.reviewNotes,
    ];
    const direct = candidates
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .find(s => !!s);
    if (direct) return direct;

    // Fallback: derive from latest STATUS_UPDATED event metadata/description
    const matching = (events || [])
      .filter(ev => (ev.type || '').toUpperCase() === 'STATUS_UPDATED')
      .reverse();
    for (const ev of matching) {
      try {
        const meta = ev.metadata ? JSON.parse(ev.metadata) : undefined;
        const fromMeta: Array<unknown> = [
          meta?.reviewNotes,
          meta?.notes,
          meta?.reason,
          meta?.message,
        ];
        const text = [...fromMeta, ev.description, ev.title]
          .map(v => (typeof v === 'string' ? v.trim() : ''))
          .find(s => !!s);
        if (text) return text;
      } catch {}
    }
    return '';
  }, [report, events]);

  const mapsHref = (lat?: number, lng?: number) => (typeof lat === 'number' && typeof lng === 'number') ? `https://www.google.com/maps?q=${lat},${lng}` : undefined;

  const handleApprove = () => {
    setApproveOpen(true);
  };

  const handleReject = () => {
    setRejectNotes('');
    setRejectOpen(true);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="text">
          Back
        </Button>
        <Typography variant="h4">Report Details</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading || !report ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Left: main info and media */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Info color="action" />
                <Typography variant="h6">Violation Information</Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Report ID</Typography>
                  <Typography variant="body1">#{(report as any).id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Submitted</Typography>
                  <Typography variant="body1"><AccessTime fontSize="small" sx={{ mr: 0.5 }} /> {createdAt ? new Date(createdAt).toLocaleString() : '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Violation Types</Typography>
                  {violationTypes.length > 0 ? (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {violationTypes.map((vt) => (
                        <Chip key={vt} label={formatViolationType(vt)} size="small" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body1">-</Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Approved Violations</Typography>
                  {(approvedViolationTypesFromMeta.length > 0 || status.toUpperCase() === 'APPROVED') ? (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {(approvedViolationTypesFromMeta.length > 0 ? approvedViolationTypesFromMeta : approvedTypes).map((vt) => (
                        <Chip key={`approved-${vt}`} label={formatViolationType(vt)} size="small" color="success" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body1">-</Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Severity</Typography>
                  <Typography variant="body1">{String((report as any).severity || '')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Vehicle Number</Typography>
                  <Typography variant="body1">{(report as any).vehicleNumber || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{formatReportStatus(status)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Reviewed By</Typography>
                  {['APPROVED','REJECTED'].includes(status.toUpperCase()) ? (
                    <Typography variant="body1">{reviewerName || 'Police'}</Typography>
                  ) : (
                    <Typography variant="body1">-</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Reviewer Notes</Typography>
                  <Typography variant="body1">{reviewerNotes || '-'}</Typography>
                </Grid>              
                <Grid item xs={12}>
                  {(['PENDING','UNDER_REVIEW'].includes(status.toUpperCase())) && (
                    <Stack direction="row" spacing={2} mt={1}>
                      <Button variant="contained" color="success" disabled={isUpdating} onClick={handleApprove}>Approve</Button>
                      <Button variant="contained" color="error" disabled={isUpdating} onClick={handleReject}>Reject</Button>
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Typography variant="h6">Media</Typography>
              </Stack>
              <Grid container spacing={2}>
                {photoPreview ? (
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Photo</Typography>
                      <img src={photoPreview} alt="Violation Photo" onError={() => photoUrl && fetchBlobFallback(photoUrl, (u) => setPhotoPreview(u))} style={{ width: '100%', borderRadius: 4, border: '1px solid var(--mui-palette-divider, rgba(0,0,0,0.12))' }} loading="lazy" />
                    </Box>
                  </Grid>
                ) : null}
                {videoPreview ? (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ position: 'relative' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Video</Typography>
                      {isVideoLoading && (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                          <CircularProgress size={28} />
                        </Box>
                      )}
                      <video
                        controls
                        preload="metadata"
                        playsInline
                        onLoadStart={() => setIsVideoLoading(true)}
                        onCanPlay={() => setIsVideoLoading(false)}
                        onLoadedData={() => setIsVideoLoading(false)}
                        onWaiting={() => setIsVideoLoading(true)}
                        onPlaying={() => setIsVideoLoading(false)}
                        onError={() => videoUrl && fetchBlobFallback(videoUrl, (u) => setVideoPreview(u))}
                        style={{ width: '100%', borderRadius: 4, border: '1px solid var(--mui-palette-divider, rgba(0,0,0,0.12))', position: 'relative' }}
                      >
                        <source src={videoPreview} type={inferVideoMimeType(videoPreview)} />
                      </video>
                    </Box>
                  </Grid>
                ) : null}
                {!photoPreview && !videoPreview && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">No media uploaded for this report.</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Right: status/audit and location */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Status & Audit</Typography>
                <Stack direction="row" spacing={1} mb={1} alignItems="center">
                  <Chip label={formatReportStatus(status)} color="primary" variant="outlined" />
                </Stack>
                {/* Timeline (Submitted → Under Review → Approved/Rejected) */}
                {(() => {
                  const timeline = (() => {
                    const items: Array<{ key: string; label: string; at: string; color: string }> = [];
                    const safePush = (key: string, label: string, at?: string | number, color: string = 'primary.main') => {
                      if (!at) return;
                      const when = typeof at === 'number' ? new Date(at).toISOString() : String(at);
                      if (!when) return;
                      if (items.find(i => i.key === key)) return;
                      items.push({ key, label, at: when, color });
                    };
                    // Submitted (from createdAt)
                    if (createdAt) safePush('submitted', 'Submitted', createdAt, 'primary.main');
                    // From events
                    (events || []).forEach((ev) => {
                      const type = (ev.type || '').toUpperCase();
                      let statusFromMeta: string | undefined;
                      try { statusFromMeta = JSON.parse(ev.metadata || 'null')?.status; } catch {}
                      const label = ev.title || (statusFromMeta ? statusFromMeta.replace(/_/g, ' ') : ev.type.replace(/_/g, ' '));
                      if (type === 'STATUS_UPDATED') {
                        const s = String(statusFromMeta || label || '').toUpperCase();
                        if (s.includes('UNDER') && s.includes('REVIEW')) safePush('under_review', 'Under Review', ev.createdAt, 'warning.main');
                        if (s.includes('APPROVED')) safePush('approved', 'Approved', ev.createdAt, 'success.main');
                        if (s.includes('REJECTED')) safePush('rejected', 'Rejected', ev.createdAt, 'error.main');
                        if (s.includes('DUPLICATE')) safePush('duplicate', 'Marked Duplicate', ev.createdAt, 'text.secondary');
                      }
                    });
                    // Fallback: if no terminal status in events, show current status timestamp if available
                    const anyReport: any = report as any;
                    const revTs = anyReport?.reviewTimestamp;
                    const cur = String(anyReport?.status || '').toUpperCase();
                    if (!items.find(i => i.key === 'under_review') && cur === 'UNDER_REVIEW') safePush('under_review', 'Under Review', revTs || createdAt, 'warning.main');
                    if (cur === 'APPROVED') safePush('approved', 'Approved', revTs || createdAt, 'success.main');
                    if (cur === 'REJECTED') safePush('rejected', 'Rejected', revTs || createdAt, 'error.main');
                    // Sort ascending by time
                    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
                    return items;
                  })();
                  return (
                    <Box sx={{ position: 'relative', pl: 3, '&:before': { content: '""', position: 'absolute', left: 12, top: 0, bottom: 0, width: 2, bgcolor: 'divider' } }}>
                      {timeline.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No events yet</Typography>
                      ) : (
                        timeline.map((it, idx) => (
                          <Box key={it.key + it.at} sx={{ position: 'relative', pl: 3, mb: idx === timeline.length - 1 ? 0 : 2, '&:before': { content: '""', position: 'absolute', left: 0, top: 2, width: 10, height: 10, bgcolor: it.color, borderRadius: '50%' } }}>
                            <Typography variant="body2" fontWeight={600}>{it.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(it.at).toLocaleString()}</Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Location</Typography>
                <Stack spacing={0.5} mb={1}>
                  <Typography variant="body2"><Place fontSize="small" sx={{ mr: 0.5 }} /> {normalizedLocation.address || '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{[normalizedLocation.city, normalizedLocation.district, normalizedLocation.state].filter(Boolean).join(', ')}{normalizedLocation.pincode ? ` - ${normalizedLocation.pincode}` : ''}</Typography>
                  {typeof normalizedLocation.latitude === 'number' && typeof normalizedLocation.longitude === 'number' && (
                    <Typography variant="caption" color="text.secondary">
                      <a href={mapsHref(normalizedLocation.latitude, normalizedLocation.longitude)} target="_blank" rel="noreferrer">{`Lat: ${normalizedLocation.latitude}, Lng: ${normalizedLocation.longitude}`}</a>
                    </Typography>
                  )}
                </Stack>
                <Box sx={{ height: 260, width: '100%' }}>
                  <MapContainer center={center} zoom={typeof normalizedLocation.latitude === 'number' ? 14 : 5} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {typeof normalizedLocation.latitude === 'number' && typeof normalizedLocation.longitude === 'number' && (
                      <Marker position={[normalizedLocation.latitude, normalizedLocation.longitude]}>
                        <Popup>
                          {normalizedLocation.address}
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Comments</Typography>
                <Stack spacing={1.5} mb={2}>
                  {(comments || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
                  ) : (
                    comments.map((c) => (
                      <Box key={String(c.id)} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="subtitle2">{c.authorName || 'Police'}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(c.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{c.message}</Typography>
                      </Box>
                    ))
                  )}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid var(--mui-palette-divider, rgba(0,0,0,0.12))' }}
                  />
                  <Button
                    variant="contained"
                    disabled={!newComment.trim()}
                    onClick={() => {
                      if (!id || !newComment.trim()) return;
                      dispatch(addReportComment({ id: Number(id), message: newComment.trim(), isInternal: true }))
                        .unwrap()
                        .then(() => setNewComment(''));
                    }}
                  >
                    Post
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Approve Report</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Select violations to approve</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mb={2}>
            {(violationTypes as string[]).map((vt) => (
              <FormControlLabel
                key={vt}
                control={<Checkbox checked={approvedTypes.includes(vt)} onChange={(e) => setApprovedTypes(prev => e.target.checked ? [...prev, vt] : prev.filter(x => x !== vt))} />}
                label={formatViolationType(vt)}
              />
            ))}
          </Stack>
          <TextField
            label="Notes (shown to citizen)"
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            required
            error={approveNotes.trim().length === 0}
            helperText={approveNotes.trim().length === 0 ? 'Please add a note for the citizen' : ' '}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
            <FormControlLabel control={<Checkbox checked={approveChallanIssued} onChange={(e) => setApproveChallanIssued(e.target.checked)} />} label="Challan issued" />
            <TextField
              label="Challan number"
              value={approveChallanNumber}
              onChange={(e) => setApproveChallanNumber(e.target.value)}
              fullWidth
              required={approveChallanIssued}
              error={approveChallanIssued && approveChallanNumber.trim().length === 0}
              helperText={approveChallanIssued && approveChallanNumber.trim().length === 0 ? 'Challan number is required when challan is issued' : ' '}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canConfirmApprove} onClick={() => {
            if (!id) return;
            dispatch(approveReport({ id: Number(id), reviewNotes: approveNotes, challanNumber: approveChallanNumber || undefined, approvedViolationTypes: approvedTypes }))
              .unwrap()
              .then(() => {
                setApproveOpen(false);
                dispatch(fetchReportById(Number(id)));
                dispatch(fetchReportEvents(Number(id)));
              });
          }}>Confirm Approve</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Report</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Provide a reason to reject this report</Typography>
          <TextField
            label="Reason (shown to citizen)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            autoFocus
            InputLabelProps={{ shrink: true }}
            margin="normal"
            required
            error={rejectNotes.trim().length === 0}
            helperText={rejectNotes.trim().length === 0 ? 'Please add a reason' : ' '}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={rejectNotes.trim().length === 0} onClick={() => {
            if (!id) return;
            dispatch(rejectReport({ id: Number(id), reviewNotes: rejectNotes }))
              .unwrap()
              .then(() => {
                setRejectOpen(false);
                dispatch(fetchReportById(Number(id)));
                dispatch(fetchReportEvents(Number(id)));
              });
          }}>Confirm Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportDetailPage;
