import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Check, Globe2, Loader2, Maximize2, Minimize2, Rotate3D, RotateCcw, Satellite, Search, Sparkles, X } from 'lucide-react';
import SkyMapGlobe from '../components/SkyMapGlobe';
import { getFeaturedTargets, searchObservations } from '../api/observations';
import { fetchJson } from '../api/client';
import type { FeaturedTarget } from '../types/observation';

type Filter = 'all' | 'nebulae' | 'galaxies' | 'stars' | 'planets' | 'other';
const CUSTOM_TARGETS_KEY = 'cosmic-eye-skymap-custom-targets';
const CONFIRMED_PLANET_SYSTEMS = new Set(['toi700', 'trappist1']);

function objectKind(type: string) {
  if (/nebula|star-forming|complex|remnant/i.test(type)) return 'nebula';
  if (/planet|exoplanet/i.test(type)) return 'planet';
  if (/galaxy/i.test(type)) return 'galaxy';
  if (/star|stellar|cluster|association/i.test(type) && !/star-forming/i.test(type)) return 'star';
  return 'other';
}

function matchesFilter(target: FeaturedTarget, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'other') return objectKind(target.type) === 'other';
  if (filter === 'stars') return objectKind(target.type) === 'star';
  if (filter === 'planets') return objectKind(target.type) === 'planet';
  return objectKind(target.type) === (filter === 'galaxies' ? 'galaxy' : 'nebula');
}

export default function SkyMapPage() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const [targets, setTargets] = useState<FeaturedTarget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [resetSignal, setResetSignal] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showConstellations, setShowConstellations] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [targetQuery, setTargetQuery] = useState('');
  const [listQuery, setListQuery] = useState('');
  const [addingTarget, setAddingTarget] = useState(false);
  const [addMessage, setAddMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === pageRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

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
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === pageRef.current) await document.exitFullscreen();
      else await pageRef.current?.requestFullscreen();
    } catch {
      // Full-screen mode can be blocked by browser or embedding policy.
    }
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
      const normalizedName = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      const confirmedPlanetSystem = CONFIRMED_PLANET_SYSTEMS.has(normalizedName);
      const type = confirmedPlanetSystem ? 'Exoplanet system'
        : /neb|hii|remnant|hii|refneb/i.test(rawType) ? 'Nebula'
          : /planet|exoplanet/i.test(rawType) ? 'Planet'
            : /galaxy|seyfert|agn|liner|starburst|gtowards|ginpair/i.test(rawType) ? 'Galaxy'
          : /cluster|association/i.test(rawType) ? 'Star cluster' : rawType;
      const added: FeaturedTarget = {
        id, name: resolved.matched_query, type, ra: resolved.ra, dec: resolved.dec,
        description: `${confirmedPlanetSystem ? 'Confirmed exoplanet system; host position resolved by SIMBAD. ' : 'Resolved by SIMBAD. '}SPHEREx archive image coverage is confirmed at this position.`,
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
      <section ref={pageRef} className={isFullscreen ? 'skymap-content is-fullscreen' : 'skymap-content'}>
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
                <button type="button" className={showConstellations ? 'skymap-map-action active' : 'skymap-map-action'} onClick={() => setShowConstellations((visible) => !visible)} title="Toggle familiar constellation outlines">{showConstellations ? <Check size={14} /> : <Sparkles size={14} />}Constellations</button>
                <button type="button" className="skymap-map-action" onClick={() => setResetSignal((value) => value + 1)} title="Reset globe orientation and zoom"><RotateCcw size={14} /> Reset</button>
                <button type="button" className="skymap-map-action" onClick={() => void toggleFullscreen()} aria-pressed={isFullscreen} title={isFullscreen ? 'Exit full-screen sky map' : 'Explore the sky map full screen'}>{isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{isFullscreen ? 'Exit' : 'Full screen'}</button>
                <span className="skymap-coordinate-system">ICRS / J2000</span>
              </div>
            </div>
            <div className="skymap-globe-wrap">
              {!loading && !error && <SkyMapGlobe targets={visibleTargets} selectedId={selectedId} onSelect={selectTarget} resetSignal={resetSignal} showGrid={showGrid} showConstellations={showConstellations} focusedTarget={selectedTarget ? { ra: selectedTarget.ra, dec: selectedTarget.dec } : null} onHover={setHoveredId} />}
              {loading && <div className="skymap-loading"><Loader2 size={24} className="spin" /> Loading observed targets…</div>}
              {error && <div className="skymap-error"><AlertCircle size={20} />{error}</div>}
              {!loading && !error && <>
                <div className="skymap-observer-label"><span className="skymap-spacecraft-icon"><Satellite size={17} /></span><span><strong>SPHEREx</strong><small>Observer · viewpoint at center</small></span></div>
              </>}
              {hoveredTarget && <div className="skymap-hover-card"><span>TARGET IN VIEW</span><strong>{hoveredTarget.name}</strong><small>RA {hoveredTarget.ra.toFixed(2)}° · Dec {hoveredTarget.dec.toFixed(2)}°</small></div>}
            </div>
            <div className="skymap-legend">
              <span><i className="legend-dot guide-star" /> Hipparcos guide stars</span>
              <span><i className="legend-dot bright-star" /> Bright Hipparcos stars</span>
              <span><i className="legend-milky-way" /> Milky Way plane</span>
              <span><i className="legend-constellation-line" /> Constellation lines</span>
              <span><i className="legend-dot nebula" /> Nebulae</span>
              <span><i className="legend-galaxy-icon" /> Galaxies (spiral marker)</span>
              <span><i className="legend-dot star" /> Stars &amp; clusters</span>
              <span><i className="legend-dot planet" /> Confirmed exoplanet systems</span>
              <span><i className="legend-dot other" /> Other covered objects</span>
            </div>
            <p className="skymap-science-note">You are viewing the sky from the SPHEREx observer point. The lavender star band follows the Milky Way’s galactic plane; its points are illustrative, not SPHEREx pixels. Gold lines connect bright Hipparcos stars into familiar constellation outlines. Colored target markers have SPHEREx image coverage. RA/Dec gives direction only, not object distance or size.</p>
          </div>

          <aside className="skymap-target-panel">
            <div className="skymap-panel-heading">
              <div><h2>SPHEREx targets</h2><p>Messier catalog + covered sky regions</p></div>
              <span>{visibleTargets.length}</span>
            </div>

            <div className="skymap-filters" role="group" aria-label="Filter sky targets">
              {(['all', 'nebulae', 'galaxies', 'stars', 'planets', 'other'] as const).map((option) => (
                <button key={option} type="button" className={filter === option ? 'skymap-filter active' : 'skymap-filter'} onClick={() => setFilterAndSelection(option)}>
                  {option === 'all' ? 'All' : option === 'nebulae' ? 'Nebulae' : option === 'galaxies' ? 'Galaxies' : option === 'stars' ? 'Stars' : option === 'planets' ? 'Planets' : 'Other'}
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
              <div className="skymap-suggestions" aria-label="Example targets">
                {['NGC 7000', 'Sirius', 'TOI-700', 'TRAPPIST-1'].map((name) => <button key={name} type="button" onClick={() => setTargetQuery(name)}>{name}</button>)}
              </div>
              <small>Suggestions are looked up with SIMBAD and added only if SPHEREx archive coverage is found. Planetary systems are plotted at their host-star position.</small>
            </form>

            <div className="skymap-local-search"><Search size={14} /><input aria-label="Filter mapped targets" value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Filter mapped targets…" /></div>

            <div className="skymap-target-list">
              {searchedTargets.map((target) => (
                <button key={target.id} type="button" className={selectedId === target.id ? 'skymap-target active' : 'skymap-target'} onClick={() => selectTarget(target.id)}>
                  <span className={`skymap-target-marker ${objectKind(target.type)}`} />
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
