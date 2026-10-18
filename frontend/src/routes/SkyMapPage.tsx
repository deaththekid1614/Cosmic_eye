import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Check, Globe2, Loader2, Pause, Play, Rotate3D, RotateCcw, Satellite, Search, X } from 'lucide-react';
import SkyMapGlobe from '../components/SkyMapGlobe';
import { getFeaturedTargets, searchObservations } from '../api/observations';
import { fetchJson } from '../api/client';
import type { FeaturedTarget } from '../types/observation';

type Filter = 'all' | 'nebulae' | 'galaxies' | 'other';
const CUSTOM_TARGETS_KEY = 'cosmic-eye-skymap-custom-targets';

function matchesFilter(target: FeaturedTarget, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'galaxies') return /galaxy/i.test(target.type);
  if (filter === 'nebulae') return /nebula|star-forming|complex|remnant/i.test(target.type);
  return !/galaxy|nebula|star-forming|complex|remnant/i.test(target.type);
}

export default function SkyMapPage() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<FeaturedTarget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [targetQuery, setTargetQuery] = useState('');
  const [listQuery, setListQuery] = useState('');
  const [addingTarget, setAddingTarget] = useState(false);
  const [addMessage, setAddMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeaturedTargets()
      .then((data) => {
        let saved: FeaturedTarget[] = [];
        try {
          const parsed: unknown = JSON.parse(window.localStorage.getItem(CUSTOM_TARGETS_KEY) || '[]');
          if (Array.isArray(parsed)) saved = parsed as FeaturedTarget[];
        } catch { /* Ignore stale or blocked local storage. */ }
        const ids = new Set(data.map((target) => target.id));
        const merged = [...data, ...saved.filter((target) => !ids.has(target.id))];
        setTargets(merged);
        setSelectedId(merged[0]?.id ?? null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load sky targets.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleTargets = useMemo(() => targets.filter((target) => matchesFilter(target, filter)), [targets, filter]);
  const selectedTarget = targets.find((target) => target.id === selectedId) ?? null;
  const hoveredTarget = targets.find((target) => target.id === hoveredId) ?? null;
  const searchedTargets = useMemo(() => visibleTargets.filter((target) => `${target.name} ${target.type}`.toLowerCase().includes(listQuery.trim().toLowerCase())), [visibleTargets, listQuery]);

  const setFilterAndSelection = (nextFilter: Filter) => {
    setFilter(nextFilter);
    const nextTargets = targets.filter((target) => matchesFilter(target, nextFilter));
    if (!nextTargets.some((target) => target.id === selectedId)) setSelectedId(nextTargets[0]?.id ?? null);
  };

  const selectTarget = (id: string) => {
    setSelectedId(id);
    setAutoRotate(false);
  };

  const addTarget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = targetQuery.trim();
    if (!query || addingTarget) return;
    setAddingTarget(true);
    setAddMessage(null);
    try {
      const resolved = await fetchJson<{ ra: number; dec: number; matched_query: string; search_radius?: number; object_type?: string }>(`/api/v1/observations/ai-search?q=${encodeURIComponent(query)}`);
      const archive = await searchObservations(resolved.ra, resolved.dec, resolved.search_radius ?? 0.01, 1, 1);
      if (archive.items.length === 0) {
        setAddMessage({ kind: 'error', text: `Found ${resolved.matched_query}, but no released SPHEREx image covers that position yet.` });
        return;
      }
      const normalized = resolved.matched_query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const id = `simbad-${normalized || `${resolved.ra.toFixed(4)}-${resolved.dec.toFixed(4)}`}`;
      const rawType = resolved.object_type || 'Astronomical object';
      const type = /galaxy|seyfert|agn|liner|starburst|gtowards|ginpair/i.test(rawType) ? 'Galaxy'
        : /neb|hii|remnant|hii|refneb/i.test(rawType) ? 'Nebula'
          : /cluster|association/i.test(rawType) ? 'Star cluster' : rawType;
      const added: FeaturedTarget = {
        id, name: resolved.matched_query, type, ra: resolved.ra, dec: resolved.dec,
        description: 'Resolved by SIMBAD. SPHEREx archive image coverage is confirmed at this position.',
        image_url: '',
      };
      const existing = targets.find((target) => target.id === id || (target.name.toLowerCase() === added.name.toLowerCase() && Math.abs(target.ra - added.ra) < 0.001 && Math.abs(target.dec - added.dec) < 0.001));
      if (existing) {
        setSelectedId(existing.id);
        setFilter('all');
        setAddMessage({ kind: 'success', text: `${existing.name} is already on your map.` });
        return;
      }
      setTargets((current) => [...current, added]);
      setSelectedId(id);
      setFilter('all');
      setTargetQuery('');
      try {
        const oldSaved = JSON.parse(window.localStorage.getItem(CUSTOM_TARGETS_KEY) || '[]') as FeaturedTarget[];
        window.localStorage.setItem(CUSTOM_TARGETS_KEY, JSON.stringify([...oldSaved, added]));
      } catch { /* The current map still works if storage is unavailable. */ }
      setAddMessage({ kind: 'success', text: `Added ${added.name} with verified SPHEREx image coverage.` });
    } catch (error) {
      setAddMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not resolve this name or check SPHEREx coverage.' });
    } finally {
      setAddingTarget(false);
    }
  };

  return (
    <div className="dashboard-wrapper skymap-page">
      <section className="skymap-content">
        <header className="skymap-heading">
          <div>
            <span className="eyebrow">SPHEREx · FULL SKY</span>
            <h1>Interactive Sky Map</h1>
            <p>Look around the sky from SPHEREx. Browse the Messier catalog and open any target with confirmed infrared image coverage.</p>
          </div>
          <div className="skymap-target-count"><Globe2 size={18} /><strong>{targets.length || '—'}</strong><span>mapped targets</span></div>
        </header>

        <div className="skymap-layout">
          <div className="skymap-viewer-card">
            <div className="skymap-toolbar">
              <span className="skymap-gesture-help"><Rotate3D size={16} /> Drag to look around · Scroll to zoom · Select a target</span>
              <div className="skymap-map-actions">
                <button type="button" className={showGrid ? 'skymap-map-action active' : 'skymap-map-action'} onClick={() => setShowGrid((visible) => !visible)} title="Toggle the RA/Dec coordinate grid">{showGrid ? <Check size={14} /> : <Globe2 size={14} />}Grid</button>
                <button type="button" className={autoRotate ? 'skymap-map-action active' : 'skymap-map-action'} onClick={() => setAutoRotate((rotating) => !rotating)} title={autoRotate ? 'Pause automatic rotation' : 'Resume automatic rotation'}>
                  {autoRotate ? <Pause size={14} /> : <Play size={14} />}{autoRotate ? 'Pause' : 'Spin'}
                </button>
                <button type="button" className="skymap-map-action" onClick={() => setResetSignal((value) => value + 1)} title="Reset globe orientation and zoom"><RotateCcw size={14} /> Reset</button>
                <span className="skymap-coordinate-system">ICRS / J2000</span>
              </div>
            </div>
            <div className="skymap-globe-wrap">
              {!loading && !error && <SkyMapGlobe targets={visibleTargets} selectedId={selectedId} onSelect={selectTarget} autoRotate={autoRotate} resetSignal={resetSignal} showGrid={showGrid} focusedTarget={selectedTarget ? { ra: selectedTarget.ra, dec: selectedTarget.dec } : null} onHover={setHoveredId} />}
              {loading && <div className="skymap-loading"><Loader2 size={24} className="spin" /> Loading observed targets…</div>}
              {error && <div className="skymap-error"><AlertCircle size={20} />{error}</div>}
              {!loading && !error && <>
                <div className="skymap-observer-label"><span className="skymap-spacecraft-icon"><Satellite size={17} /></span><span><strong>SPHEREx</strong><small>Observer · viewpoint at center</small></span></div>
              </>}
              {hoveredTarget && <div className="skymap-hover-card"><span>TARGET IN VIEW</span><strong>{hoveredTarget.name}</strong><small>RA {hoveredTarget.ra.toFixed(2)}° · Dec {hoveredTarget.dec.toFixed(2)}°</small></div>}
            </div>
            <div className="skymap-legend">
              <span><i className="legend-dot guide-star" /> Hipparcos guide stars</span>
              <span><i className="legend-dot nebula" /> Nebulae & star-forming regions</span>
              <span><i className="legend-dot galaxy" /> Galaxies</span>
              <span><i className="legend-dot other" /> Other targets</span>
            </div>
            <p className="skymap-science-note">You are viewing the sky from the SPHEREx observer point. Colored target markers have SPHEREx image coverage; faint white stars are Hipparcos guide stars. RA/Dec gives direction only, not object distance or size.</p>
          </div>

          <aside className="skymap-target-panel">
            <div className="skymap-panel-heading">
              <div><h2>SPHEREx targets</h2><p>Messier catalog + covered sky regions</p></div>
              <span>{visibleTargets.length}</span>
            </div>

            <div className="skymap-filters" role="group" aria-label="Filter sky targets">
              {(['all', 'nebulae', 'galaxies', 'other'] as const).map((option) => (
                <button key={option} type="button" className={filter === option ? 'skymap-filter active' : 'skymap-filter'} onClick={() => setFilterAndSelection(option)}>
                  {option === 'all' ? 'All' : option === 'nebulae' ? 'Nebulae' : option === 'galaxies' ? 'Galaxies' : 'Other'}
                </button>
              ))}
            </div>

            <form className="skymap-object-search" onSubmit={addTarget}>
              <label htmlFor="skymap-target-search">Add any covered object</label>
              <div className="skymap-object-search-row">
                <Search size={16} />
                <input id="skymap-target-search" value={targetQuery} onChange={(event) => setTargetQuery(event.target.value)} placeholder="Try M81, NGC 7000, or a name" />
                {targetQuery && <button type="button" className="skymap-search-clear" onClick={() => setTargetQuery('')} aria-label="Clear target name"><X size={14} /></button>}
                <button type="submit" disabled={!targetQuery.trim() || addingTarget}>{addingTarget ? <Loader2 size={15} className="spin" /> : 'Add'}</button>
              </div>
              {addMessage && <p className={`skymap-search-message ${addMessage.kind}`} role="status">{addMessage.text}</p>}
              <small>Names are resolved with SIMBAD; a marker is added only when SPHEREx returns image coverage.</small>
            </form>

            <div className="skymap-local-search"><Search size={14} /><input aria-label="Filter mapped targets" value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Filter mapped targets…" /></div>

            <div className="skymap-target-list">
              {searchedTargets.map((target) => (
                <button key={target.id} type="button" className={selectedId === target.id ? 'skymap-target active' : 'skymap-target'} onClick={() => selectTarget(target.id)}>
                  <span className={`skymap-target-marker ${/galaxy/i.test(target.type) ? 'galaxy' : /nebula|star-forming|complex|remnant/i.test(target.type) ? 'nebula' : 'other'}`} />
                  <span className="skymap-target-name"><strong>{target.name}</strong><small>{target.type}</small></span>
                  <span className="skymap-target-check" aria-label="SPHEREx archive coverage">✓</span>
                </button>
              ))}
            </div>

            {selectedTarget && (
              <div className="skymap-selected-card">
                <span className="eyebrow">SELECTED REGION</span>
                <h3>{selectedTarget.name}</h3>
                <p>{selectedTarget.description}</p>
                <dl>
                  <div><dt>Right ascension</dt><dd>{selectedTarget.ra.toFixed(3)}°</dd></div>
                  <div><dt>Declination</dt><dd>{selectedTarget.dec.toFixed(3)}°</dd></div>
                </dl>
                <button type="button" className="glow-btn skymap-explore-button" onClick={() => navigate('/explore', { state: { ra: selectedTarget.ra.toString(), dec: selectedTarget.dec.toString(), targetName: selectedTarget.name } })}>
                  Open SPHEREx images <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
