import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Minus, Plus, RotateCcw } from "lucide-react";
import {
  computeMindMapLayout,
  countVisibleNodes,
  type MindMapNode,
  type PositionedNode,
} from "@/lib/mind-map-layout";

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.2;
const INITIAL_SCALE = 0.85;
/** أقل مسافة سحب (بكسل الشاشة) قبل اعتبار الحركة "سحبًا" لا "نقرًا" على عقدة */
const DRAG_THRESHOLD = 6;

interface Point { x: number; y: number }
interface ViewState { scale: number; pan: Point }

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  // منحنى بيزيه أفقي ناعم بين الأب (يمين) والابن (يسار) — نفس أسلوب أدوات
  // مخططات الأشجار المعروفة (org-chart/flow)، بلا أي مكتبة خارجية.
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

export function MindMapCanvas({ root, mapId }: { root: MindMapNode; mapId: string }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [view, setView] = useState<ViewState>({ scale: INITIAL_SCALE, pan: { x: 0, y: 0 } });

  // إعادة الضبط عند تغيّر الخريطة نفسها (تبديل بطاقة أخرى بنفس المكوّن)
  useEffect(() => {
    setCollapsed(new Set());
  }, [mapId]);

  const layout = useMemo(() => computeMindMapLayout(root, collapsed), [root, collapsed]);
  const totalVisible = useMemo(() => countVisibleNodes(root, collapsed), [root, collapsed]);

  // ضبط أوّلي: العقدة الجذر (x=0) على يمين الإطار تقريبًا، ووسطها رأسيًا
  const centerView = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rootNode = layout.nodes.find(n => n.depth === 0);
    const rootY = rootNode?.y ?? 0;
    setView({
      scale: INITIAL_SCALE,
      pan: { x: rect.width * 0.7, y: rect.height / 2 - rootY * INITIAL_SCALE },
    });
  }, [layout.nodes]);

  // إعادة توسيط بعد أي طيّ/بسط: بلا هذا، طيّ الجذر إلى عقدة وحيدة (مثلًا) يُبقي
  // pan/scale محسوبَين على تخطيط الشجرة الكاملة السابق، فقد تنزلق العقدة الباقية
  // فعليًا خارج منطقة .mmv-viewport المقصوصة (overflow:hidden) — أي "تختفي" على
  // المستخدم الحقيقي بلا أي طريقة لرؤيتها غير الضغط اليدوي على "إعادة الضبط".
  // اكتُشف هذا فعليًا (لا افتراضًا) أثناء اختبار طيّ/بسط الجذر بـPlaywright.
  useEffect(() => {
    centerView();
  }, [mapId, centerView]);

  /* ── سحب/تحريك (Pan) بالمؤشر أو اللمس ── */
  const pointers = useRef(new Map<number, Point>());
  const dragDistance = useRef(0);
  const pinchState = useRef<{ distance: number } | null>(null);

  // pointerId → هل استُدعي setPointerCapture له فعلًا؟ (لا نلتقط فور pointerdown —
  // راجع الشرح تحت onPointerMove لسبب أن ذلك كان يكسر النقر على أزرار العقد)
  const captured = useRef(new Set<number>());

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragDistance.current = 0;
    pinchState.current = null;
    // عمدًا: لا نستدعي setPointerCapture هنا. راجع onPointerMove.
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const distX = pts[0].x - pts[1].x;
      const distY = pts[0].y - pts[1].y;
      const dist = Math.hypot(distX, distY);
      const rect = viewportRef.current?.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) / 2 - (rect?.left ?? 0);
      const midY = (pts[0].y + pts[1].y) / 2 - (rect?.top ?? 0);

      if (pinchState.current) {
        const factor = dist / pinchState.current.distance;
        setView(prevView => {
          const newScale = clamp(prevView.scale * factor, MIN_SCALE, MAX_SCALE);
          const worldX = (midX - prevView.pan.x) / prevView.scale;
          const worldY = (midY - prevView.pan.y) / prevView.scale;
          return { scale: newScale, pan: { x: midX - worldX * newScale, y: midY - worldY * newScale } };
        });
      }
      pinchState.current = { distance: dist };
      return;
    }

    dragDistance.current += Math.abs(dx) + Math.abs(dy);

    // نلتقط المؤشر فقط بعد تجاوز عتبة سحب حقيقية، لا فور pointerdown. السبب:
    // setPointerCapture يُعيد توجيه pointerup (وبالتبعية mouseup) اللاحق إلى
    // العنصر اللاقط (.mmv-viewport) لا الزر الأصلي الذي بدأ عليه الضغط. حين
    // تختلف هدف mousedown (الزر) عن هدف mouseup المُعاد توجيهه (viewport)،
    // يُصعِّد المتصفح حدث "click" الاصطناعي إلى أقرب سلف مشترك — أي
    // .mmv-viewport نفسه — فلا يصل الحدث إلى onClick الزر إطلاقًا. كان هذا
    // يُسكِت كل نقرة على أي عقدة أو رابط داخل القماش بلا أي خطأ ظاهر (اكتُشف
    // بمقارنة composedPath() الفعلي لحدث click مع الزر المستهدَف). الالتقاط
    // المتأخر (بعد العتبة فقط) يحل هذا: نقرة عادية بلا حركة تُذكر لا تلتقط
    // المؤشر أبدًا فيَصل click لعنصره الحقيقي، بينما السحب الفعلي يلتقط بمجرد
    // تأكّده فيستمر تتبّعه حتى خارج حدود .mmv-viewport كما هو مطلوب.
    if (dragDistance.current > DRAG_THRESHOLD && !captured.current.has(e.pointerId)) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        captured.current.add(e.pointerId);
      } catch {
        // لا شيء: السحب يعمل حتى بلا capture طالما بقيت الأحداث تصل لهذا العنصر
      }
    }

    setView(prevView => ({ ...prevView, pan: { x: prevView.pan.x + dx, y: prevView.pan.y + dy } }));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    captured.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchState.current = null;
  }, []);

  /* ── تكبير بعجلة الفأرة (تتطلب مستمعًا حقيقيًا passive:false كي يعمل preventDefault) ── */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      setView(prev => {
        const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
        const worldX = (cx - prev.pan.x) / prev.scale;
        const worldY = (cy - prev.pan.y) / prev.scale;
        return { scale: newScale, pan: { x: cx - worldX * newScale, y: cy - worldY * newScale } };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const el = viewportRef.current;
    const rect = el?.getBoundingClientRect();
    const cx = (rect?.width ?? 0) / 2;
    const cy = (rect?.height ?? 0) / 2;
    setView(prev => {
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      const worldX = (cx - prev.pan.x) / prev.scale;
      const worldY = (cy - prev.pan.y) / prev.scale;
      return { scale: newScale, pan: { x: cx - worldX * newScale, y: cy - worldY * newScale } };
    });
  }, []);

  const toggleNode = useCallback((id: string) => {
    // نقرة حقيقية فقط (لا نهاية سحب) — يتجاهل toggle إن تحرّك المؤشر أكثر من العتبة
    if (dragDistance.current > DRAG_THRESHOLD) return;
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="mmv-wrap">
      <div
        className="mmv-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        // role="group" لا "img": هذا الحاوية تضم أزرارًا وروابط حقيقية تفاعلية
        // (عقد الخريطة)، وrole="img" في نموذج ARIA لا يسمح بعناصر تفاعلية
        // فرعية إطلاقًا. تحقّقتُ فعليًا عبر ariaSnapshot أن Chromium لا يُخفي
        // العناصر الفرعية عمليًا حتى مع role="img" (سلوك متسامح خاص بهذا
        // المحرك تحديدًا)، لكن الاعتماد على تسامح محرك واحد بدل التوافق مع
        // نموذج ARIA نفسه خطر حقيقي عبر متصفحات/تقنيات مساعدة أخرى — أُصلح
        // بـrole="group" (الدور الصحيح لحاوية عناصر تفاعلية ذات وصف جماعي).
        role="group"
        aria-label={`خريطة ذهنية بصرية تفاعلية، ${totalVisible} عقدة مرئية حاليًا. اسحب للتحريك، واستخدم التكبير/التصغير أو عجلة الفأرة.`}
      >
        <div
          className="mmv-canvas"
          style={{ transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.scale})` }}
        >
          <svg className="mmv-edges" aria-hidden="true">
            {layout.edges.map(edge => (
              <path key={`${edge.fromId}->${edge.toId}`} d={edgePath(edge.x1, edge.y1, edge.x2, edge.y2)} />
            ))}
          </svg>
          {layout.nodes.map(node => (
            <MindMapCanvasNode key={node.id} node={node} onToggle={toggleNode} />
          ))}
        </div>
      </div>

      <div className="mmv-controls" role="group" aria-label="أدوات التكبير والتصغير">
        <button type="button" className="mmv-ctrl-btn" onClick={() => zoomBy(1.25)} aria-label="تكبير">
          <Plus size={16} strokeWidth={2.4} />
        </button>
        <button type="button" className="mmv-ctrl-btn" onClick={() => zoomBy(0.8)} aria-label="تصغير">
          <Minus size={16} strokeWidth={2.4} />
        </button>
        <button type="button" className="mmv-ctrl-btn" onClick={centerView} aria-label="إعادة ضبط العرض">
          <RotateCcw size={15} strokeWidth={2.2} />
        </button>
      </div>

      <p className="mmv-count">{totalVisible} عقدة مرئية</p>
    </div>
  );
}

function MindMapCanvasNode({ node, onToggle }: { node: PositionedNode; onToggle: (id: string) => void }) {
  const depthClass = `mmv-node--d${Math.min(node.depth, 4)}`;
  return (
    <div
      className={`mmv-node ${depthClass}${node.collapsed ? " mmv-node--collapsed" : ""}`}
      style={{ left: node.x, top: node.y }}
    >
      <button
        type="button"
        className={`mmv-node__btn${node.hasChildren ? "" : " mmv-node__btn--leaf"}`}
        onClick={() => node.hasChildren && onToggle(node.id)}
        aria-expanded={node.hasChildren ? !node.collapsed : undefined}
      >
        <span className="mmv-node__text">{node.label}</span>
        {node.hasChildren && (
          <span className="mmv-node__badge" aria-hidden="true">{node.collapsed ? "+" : "−"}</span>
        )}
      </button>
      {node.href && (
        <Link href={node.href} className="mmv-node__link" aria-label={`فتح ${node.label}`}>
          <ExternalLink size={11} strokeWidth={2.2} />
        </Link>
      )}
    </div>
  );
}
