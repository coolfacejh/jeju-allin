import { courseForPlace, isOlleSegment } from '../lib/olle';
import AccessPanel from '../components/AccessPanel';
import { tourAccessSource, readTourSources } from '../lib/accessStore';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { loadPlaces, rememberPlaces } from '../lib/places';
import { calculateCuration } from '../lib/curate';
import { fetchAccessDetail, type AccessDetail } from '../lib/live';
import { loadProfile, loadSavedIds, saveSavedIds, loadWalkNotes, saveWalkNote } from '../lib/storage';
import { kakaoMapUrl, kakaoRouteUrl, naverMapUrl, googleMapUrl } from '../lib/maps';
import { useI18n } from '../i18n';
import SpeakButton from '../components/SpeakButton';

const TYPE_LABEL: Record<string, string> = { stay: '숙소', food: '미식', activity: '액티비티' };

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const placeId = Number(id);
  const base = loadPlaces().find((c) => c.id === placeId);
  const profile = loadProfile();

  const curated = useMemo(() => {
    if (!base || !profile) return null;
    return calculateCuration([base], profile)[0];
  }, [base, profile]);

  const [saved, setSaved] = useState<boolean>(() => loadSavedIds().includes(placeId));
  const todayKey = new Date().toISOString().slice(0, 10);
  const [note, setNote] = useState<string>(() => loadWalkNotes()[todayKey] ?? '');

  const tourId = base?.provenance?.source==='tourapi' ? placeId : Number(base?.accessSources?.find(s=>s.source==='tourapi')?.sourceId) || undefined;
  // 무장애 정보(배리어프리 서비스)
  const [access, setAccess] = useState<AccessDetail | null>(null);
  useEffect(() => {
    let alive = true;
    if (!tourId) return;
    fetchAccessDetail(tourId).then((d) => { if (alive) setAccess(d); });
    return () => { alive = false; };
  }, [placeId, tourId]);

  const olle = courseForPlace(placeId);
  if (olle) return <Navigate to={`/olle/${olle.slug}${isOlleSegment(placeId) ? "?segment=1" : ""}`} replace />;
  if (!base) return <Navigate to="/home" replace />;

  function toggleSave() {
    if (base && !rememberPlaces([base])) { window.alert('장소 저장에 실패했어요. 저장 공간을 확인해 주세요.'); return; }
    const ids = loadSavedIds();
    const next = ids.includes(placeId) ? ids.filter((x) => x !== placeId) : [...ids, placeId];
    if (next.length > 100) { window.alert('한 여행에는 최대 100곳까지 담을 수 있어요.'); return; }
    if (!saveSavedIds(next)) { window.alert('저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); return; }
    setSaved(next.includes(placeId));
  }

  const a = base.accessibility;
  const accBadges: string[] = [];
  if (a?.barrierFree) accBadges.push('♿ 무장애 정보 등록');
  if (a?.strollerOK) accBadges.push('🚼 유모차 정보 · 확인 필요');
  if (a?.elevator) accBadges.push('🛗 엘리베이터');
  if (a?.noKidsZone) accBadges.push('🚫 노키즈존');

  const foodTags: string[] = [];
  if (base.food?.halal) foodTags.push('할랄');
  if (base.food?.vegetarian) foodTags.push('베지테리언');
  if (base.food?.vegan) foodTags.push('비건');
  if (base.food?.noPork) foodTags.push('돼지고기 미사용');
  if (base.food?.noSeafood) foodTags.push('해산물 미사용');

  function spokenText(): string {
    const b = base!;
    const parts: string[] = [b.name, b.region, b.desc];
    if (curated?.reasons?.length) parts.push('추천 이유. ' + curated.reasons.join('. '));
    if (b.menu?.length) parts.push('메뉴. ' + b.menu.slice(0, 3).map((m) => `${m.name} ${m.price.toLocaleString()}원`).join('. '));
    if (b.cultureTips?.length) parts.push('문화 팁. ' + b.cultureTips.join(' '));
    return parts.join('. ');
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink pb-10">
      {/* 히어로 */}
      <div className="app-shell mx-auto relative h-56 md:h-80 bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-7xl overflow-hidden">
        {/^https?:\/\//.test(base.image) ? (
          <img src={base.image} alt={base.name} className="w-full h-full object-cover" />
        ) : (
          base.image
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-ink active:scale-95 shadow-sm"
          aria-label="뒤로"
        >
          <Icon name="arrow_back" className="text-[22px]" />
        </button>
        <button
          onClick={toggleSave}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 ${
            saved ? 'text-accent' : 'text-muted'
          }`}
          aria-label="담기"
        >
          <Icon name="favorite" className="text-[20px]" fill={saved} />
        </button>
        {curated && (
          <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1 shadow-md">
            <Icon name="spa" className="text-[15px]" fill />
            {curated.matchScore}점 {curated.matchGrade}
          </div>
        )}
      </div>

      <main className="app-shell mx-auto px-4 -mt-6 relative flex flex-col gap-4">
        {/* 기본 정보 */}
        <section className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-sub text-muted font-bold">
                {TYPE_LABEL[base.contentType]}
              </span>
              {base.rating > 0 && (
                <div className="flex items-center gap-1 text-accent">
                  <Icon name="star" className="text-[16px]" fill />
                  <span className="text-sm font-bold">{base.rating}</span>
                  <span className="text-[11px] text-muted">({base.reviewCount})</span>
                </div>
              )}
            </div>
            <SpeakButton getText={spokenText} />
          </div>
          <h1 className="text-[22px] font-extrabold leading-tight">{base.name}</h1>
          <a
            href={kakaoMapUrl(base.name, base.lat, base.lng)}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted flex items-center gap-1 hover:text-primary w-fit"
          >
            <Icon name="location_on" className="text-[16px]" />
            {base.region}
            <Icon name="open_in_new" className="text-[13px]" />
          </a>
          <p className="text-sm text-sub mt-1">{base.desc}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(base.hashtags ?? []).map((h) => (
              <span key={h} className="px-2 py-0.5 rounded-md bg-surface-sub text-muted text-[11px]">
                {h}
              </span>
            ))}
          </div>
          {base.rating === 0 && (
            <p className="text-[11px] text-muted flex items-center gap-1 mt-1">
              <Icon name="info" className="text-[13px]" /> {base.provenance?.source === 'tourapi' ? '출처: 한국관광공사 관광정보' : base.provenance?.source === 'visitjeju' ? '출처: 제주관광공사 비짓제주' : base.provenance?.source === 'shared' ? '출처: 공유자가 전달한 장소' : '출처: 앱 초기 수록 정보 · 현장 미검증'}
            </p>
          )}
        </section>

        <p className="text-xs text-muted px-2">운영시간·요금·편의시설은 방문 전 확인이 필요합니다.
          {base.provenance?.retrievedAt && ` 정보 수신: ${new Date(base.provenance.retrievedAt).toLocaleDateString('ko-KR')} (현장 확인일 아님)`}
        </p>
        <AccessPanel place={access ? {...base,accessSources:[...(base.accessSources??[]).filter(s=>s.source!=='tourapi'),readTourSources()[tourId!] ?? tourAccessSource(tourId!,access)]}:base} />
        {/* 무장애 정보 (한국관광공사 무장애여행) */}
        {access?.has &&
          (() => {
            const rows: { icon: string; label: string; val: string }[] = [];
            const add = (icon: string, label: string, val?: string) => { if (val && val.trim()) rows.push({ icon, label, val }); };
            add('accessible', '휠체어', access.wheelchair);
            add('directions_walk', '주 출입구', access.exit);
            add('route', '이동로', access.route);
            add('wc', '장애인 화장실', access.restroom);
            add('local_parking', '장애인 주차', access.parking);
            add('elevator', '엘리베이터', access.elevator);
            add('child_friendly', '유모차', access.stroller);
            add('hearing', '음성 안내', access.audioguide);
            add('pets', '보조견 동반', access.helpdog);
            add('directions_bus', '대중교통', access.publictransport);
            if (rows.length === 0) return null;
            return (
              <Card title="무장애 정보" icon="accessible">
                <div className="flex items-center gap-1 mb-2 text-[11px] text-tertiary bg-tertiary-light px-2 py-1 rounded-full w-fit font-bold">
                  <Icon name="verified" className="text-[13px]" fill /> 한국관광공사 무장애여행 등록 장소
                </div>
                <ul className="flex flex-col gap-2">
                  {rows.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Icon name={r.icon} className="text-[18px] text-primary shrink-0 mt-0.5" />
                      <span><b className="text-ink">{r.label}</b> <span className="text-sub">· {r.val}</span></span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })()}

        {/* 위치 · 길찾기 (지도앱 연동) */}
        <Card title={t('d.locroute')} icon="map">
          <a
            href={kakaoRouteUrl(base.name, base.lat, base.lng)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full h-11 rounded-full bg-primary text-white font-bold text-sm active:scale-95 mb-2"
          >
            <Icon name="directions" className="text-[18px]" />
            {t('d.kakaoRoute')}
          </a>
          <div className="grid grid-cols-3 gap-2">
            <a href={kakaoMapUrl(base.name, base.lat, base.lng)} target="_blank" rel="noreferrer" className="text-center py-2 rounded-xl bg-surface-sub text-sm font-bold text-sub active:scale-95">
              카카오맵
            </a>
            <a href={naverMapUrl(base.name)} target="_blank" rel="noreferrer" className="text-center py-2 rounded-xl bg-surface-sub text-sm font-bold text-sub active:scale-95">
              네이버지도
            </a>
            <a href={googleMapUrl(base.name, base.lat, base.lng)} target="_blank" rel="noreferrer" className="text-center py-2 rounded-xl bg-surface-sub text-sm font-bold text-sub active:scale-95">
              구글맵
            </a>
          </div>
          <p className="text-[11px] text-muted mt-2">* 앱이 설치돼 있으면 지도앱으로, 아니면 웹 지도로 열립니다.</p>
        </Card>

        {/* 추천 이유 */}
        {curated && curated.reasons.length > 0 && (
          <Card title={t('home.reason')} icon="auto_awesome">
            <ul className="text-sm flex flex-col gap-1.5">
              {curated.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 메뉴 */}
        {base.menu && base.menu.length > 0 && (
          <Card title={t('d.menu')} icon="restaurant_menu">
            <ul className="flex flex-col divide-y divide-line">
              {base.menu.map((m) => (
                <li key={m.name} className="flex items-start justify-between py-2.5 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{m.name}</span>
                      {m.popular && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-light text-accent font-bold">{t('common.popular')}</span>
                      )}
                    </div>
                    {m.note && <div className="text-xs text-muted mt-0.5">{m.note}</div>}
                  </div>
                  <span className="font-bold text-sm text-primary shrink-0">
                    {m.price.toLocaleString()}원
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 접근성 */}
        {accBadges.length > 0 && (
          <Card title={t('d.access')} icon="accessible">
            <div className="flex flex-wrap gap-1.5">
              {accBadges.map((b) => (
                <span key={b} className="text-[12px] px-2.5 py-1 rounded-full bg-tertiary-light text-tertiary font-medium">
                  {b}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 반려견 동반 */}
        {base.pet?.petFriendly && (
          <Card title={t('d.pet')} icon="pets">
            <ul className="text-sm text-sub flex flex-col gap-1.5">
              <li className="flex items-center gap-2">
                <Icon name="check_circle" className="text-primary text-[16px]" fill />
                {t('pet.sizeMax')}: <strong>{t(`pet.${base.pet.sizeMax ?? 'large'}`)}</strong>
              </li>
              {base.pet.offLeash && (
                <li className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-primary text-[16px]" fill />
                  {t('pet.offLeash')}
                </li>
              )}
              {base.pet.indoor && (
                <li className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-primary text-[16px]" fill />
                  {t('pet.indoor')}
                </li>
              )}
              {base.pet.fee != null && (
                <li className="flex items-center gap-2">
                  <Icon name="payments" className="text-muted text-[16px]" />
                  {t('pet.fee')}: <strong>{base.pet.fee.toLocaleString()}원</strong>
                </li>
              )}
            </ul>
          </Card>
        )}

        {/* 음식 정보 */}
        {foodTags.length > 0 && (
          <Card title={t('d.food')} icon="restaurant">
            <div className="flex flex-wrap gap-1.5">
              {foodTags.map((f) => (
                <span key={f} className="text-[12px] px-2.5 py-1 rounded-full bg-accent-light text-accent font-medium">
                  {f}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-2">* 정확한 정보는 방문 전 매장에 확인하세요.</p>
          </Card>
        )}

        {/* 매장 현장 안내 (culture-qr) */}
        {base.venueGuide && (
          <Card title={t('d.venue')} icon="qr_code_2">
            {base.venueGuide.languages && (
              <p className="text-xs text-sub mb-1">
                지원 언어: {base.venueGuide.languages.join(', ').toUpperCase()}
              </p>
            )}
            {base.venueGuide.allergens && (
              <p className="text-xs text-sub mb-1">주요 알러지원: {base.venueGuide.allergens.join(', ')}</p>
            )}
            {base.venueGuide.payment && (
              <p className="text-xs text-sub mb-2">
                결제: {[base.venueGuide.payment.krw && '현금', base.venueGuide.payment.card && '카드', base.venueGuide.payment.wechatPay ? '위챗페이' : '위챗페이 불가'].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="flex gap-2">
              {base.venueGuide.entranceUrl && (
                <a href={base.venueGuide.entranceUrl} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 rounded-full bg-primary text-white text-xs font-bold">
                  입구 안내
                </a>
              )}
              {base.venueGuide.tableUrl && (
                <a href={base.venueGuide.tableUrl} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 rounded-full bg-surface-sub text-primary text-xs font-bold">
                  테이블 안내
                </a>
              )}
              {!base.venueGuide.entranceUrl && !base.venueGuide.tableUrl && (
                <p className="text-[11px] text-muted">QR 현장 안내 페이지가 곧 연결됩니다.</p>
              )}
            </div>
          </Card>
        )}

        {/* 토닥이 산책 */}
        {base.walkGuide?.available && (
          <Card title={`토닥이 힐링 산책 (${base.walkGuide.durationMin}분)`} icon="self_improvement">
            <ol className="flex flex-col gap-2 mb-3">
              {base.walkGuide.scenes.map((s, i) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold">{s}</div>
                    <div className="text-xs text-muted">{base.walkGuide!.prompts[i]}</div>
                  </div>
                </li>
              ))}
            </ol>
            <label className="text-xs font-bold text-primary">오늘의 한마디</label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                saveWalkNote(todayKey, e.target.value);
              }}
              rows={2}
              placeholder="오늘의 나에게 건네는 한마디를 적어보세요…"
              className="w-full mt-1 text-sm p-2.5 rounded-xl border border-line bg-surface outline-none focus:border-primary resize-none"
            />
          </Card>
        )}

        {/* 문화 팁 (외국인 대상) */}
        {base.cultureTips && base.cultureTips.length > 0 && (
          <Card title={t('d.culture')} icon="tips_and_updates">
            <ul className="flex flex-col gap-1.5">
              {base.cultureTips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-sub">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 방문자 후기 */}
        {base.reviews && base.reviews.length > 0 && (
          <Card title={`${t('d.reviews')} (${base.reviews.length})`} icon="reviews">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-line">
              <span className="text-2xl font-extrabold text-primary">{base.rating}</span>
              <div>
                <div className="text-accent text-sm leading-none">
                  {'★'.repeat(Math.round(base.rating))}
                  <span className="text-line">{'★'.repeat(5 - Math.round(base.rating))}</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5">리뷰 {base.reviewCount}개</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {base.reviews.map((r, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{r.author}</span>
                    <span className="text-[11px] text-muted">{r.date}</span>
                  </div>
                  <div className="text-accent text-xs leading-none">
                    {'★'.repeat(r.rating)}
                    <span className="text-line">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="text-sm text-sub">{r.text}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-3">* 샘플 후기입니다. 실서비스에선 플레이스 리뷰가 연동됩니다.</p>
          </Card>
        )}
      </main>

      {/* 담기 CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-md border-t border-line">
        <div className="app-shell mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => navigate('/home')}
            className="w-14 h-12 rounded-full bg-white shadow-card text-muted flex items-center justify-center active:scale-95"
            aria-label="큐레이션"
          >
            <Icon name="explore" className="text-[22px]" />
          </button>
          <button
            onClick={toggleSave}
            className={`flex-1 h-12 rounded-full font-bold flex items-center justify-center gap-1.5 active:scale-95 ${
              saved ? 'bg-surface-sub text-primary' : 'bg-primary text-white'
            }`}
          >
            <Icon name={saved ? 'check_circle' : 'add'} className="text-[20px]" fill={saved} />
            {saved ? t('home.saved') : t('home.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-1.5 mb-2 text-primary">
        <Icon name={icon} className="text-[18px]" />
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
