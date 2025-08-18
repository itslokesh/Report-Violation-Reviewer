import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, Stack, Alert, CircularProgress } from '@mui/material';
import { ArrowBack, Place, AccessTime, Info } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchReportById, selectCurrentReport, selectReportsLoading, selectReportsError, approveReport, rejectReport, selectReportsUpdating } from '../../store/slices/reportsSlice';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { APP_CONFIG } from '../../config/app.config';
import { formatViolationType } from '../../shared/utils/formatting';

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

  useEffect(() => {
    if (id) {
      dispatch(fetchReportById(Number(id)));
    }
  }, [dispatch, id]);

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

  const createdAt = (report as any)?.createdAt || (report as any)?.timestamp;
  const reviewTimestamp = (report as any)?.reviewTimestamp;
  const status = String((report as any)?.status || '');
  const reviewLabel = status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : status === 'DUPLICATE' ? 'Marked Duplicate' : status === 'UNDER_REVIEW' ? 'Under Review' : 'Reviewed';
  const reviewDotColor = status === 'APPROVED' ? 'success.main' : status === 'REJECTED' ? 'error.main' : 'warning.main';

  const mapsHref = (lat?: number, lng?: number) => (typeof lat === 'number' && typeof lng === 'number') ? `https://www.google.com/maps?q=${lat},${lng}` : undefined;

  const handleApprove = () => {
    if (!id) return;
    dispatch(approveReport({ id: Number(id), reviewNotes: 'Approved via UI', challanNumber: undefined }));
  };

  const handleReject = () => {
    if (!id) return;
    dispatch(rejectReport({ id: Number(id), reviewNotes: 'Rejected via UI' }));
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
                  <Typography variant="body2" color="text.secondary">Severity</Typography>
                  <Typography variant="body1">{String((report as any).severity || '')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{status}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Vehicle Number</Typography>
                  <Typography variant="body1">{(report as any).vehicleNumber || '-'}</Typography>
                </Grid>
                {(report as any)?.reviewNotes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                    <Typography variant="body1">{(report as any).reviewNotes}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} mt={1}>
                    <Button variant="contained" color="success" disabled={isUpdating} onClick={handleApprove}>Approve</Button>
                    <Button variant="contained" color="error" disabled={isUpdating} onClick={handleReject}>Reject</Button>
                  </Stack>
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
                  <Chip label={status} color="primary" variant="outlined" />
                </Stack>
                {/* Timeline */}
                <Box sx={{ position: 'relative', pl: 3, '&:before': { content: '""', position: 'absolute', left: 12, top: 0, bottom: 0, width: 2, bgcolor: 'divider' } }}>
                  <Box sx={{ position: 'relative', pl: 3, mb: 2, '&:before': { content: '""', position: 'absolute', left: 0, top: 2, width: 10, height: 10, bgcolor: 'primary.main', borderRadius: '50%' } }}>
                    <Typography variant="body2" fontWeight={600}>Submitted</Typography>
                    <Typography variant="caption" color="text.secondary">{createdAt ? new Date(createdAt).toLocaleString() : '-'}</Typography>
                  </Box>
                  {reviewTimestamp && (
                    <Box sx={{ position: 'relative', pl: 3, '&:before': { content: '""', position: 'absolute', left: 0, top: 2, width: 10, height: 10, bgcolor: reviewDotColor, borderRadius: '50%' } }}>
                      <Typography variant="body2" fontWeight={600}>{reviewLabel}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(reviewTimestamp).toLocaleString()}</Typography>
                    </Box>
                  )}
                </Box>
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
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ReportDetailPage;
