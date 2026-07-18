/**
 * تخطيط هندسي حقيقي لخريطة ذهنية شجرية (لا قائمة نصية).
 *
 * خوارزمية "الشجرة المدمجة" (compact tree layout) المبسّطة: كل عقدة ورقية
 * تأخذ صفًا رأسيًا واحدًا بارتفاع ثابت (NODE_ROW_HEIGHT)، وكل عقدة أب تُوضع
 * عموديًا في منتصف المسافة بين أول وآخر أبنائها المرئيين (لا المتوسط الحسابي
 * لكل الأبناء، بل نقطة المنتصف الهندسية بين الطرفين) — هذا ما يمنع تراكب
 * الفروع الكبيرة مع الصغيرة إخوةً لبعضها.
 *
 * الجذر عند x=0 والعمق يتزايد بالسالب (يسارًا) عمدًا: التطبيق بأكمله RTL،
 * فوضع الجذر يمينًا والفروع تمتد يسارًا يطابق اتجاه القراءة الطبيعي بلا أي
 * حاجة لقلب CSS (transform: scaleX(-1)) الذي كان سيتطلب قلبًا مضاعفًا للنص
 * داخل كل عقدة لإبقائه مقروءًا — هذا الحل أبسط ولا يخاطر بأي bidi/mirroring.
 */

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
  href?: string;
}

export interface PositionedNode {
  id: string;
  label: string;
  href?: string;
  depth: number;
  x: number;
  y: number;
  hasChildren: boolean;
  collapsed: boolean;
}

export interface LayoutEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MindMapLayout {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
  /** الحدود القصوى (بوحدات التخطيط، لا بكسل الشاشة) لضبط منظور البداية */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export const NODE_ROW_HEIGHT = 58;
export const LEVEL_WIDTH = 210;

export function computeMindMapLayout(
  root: MindMapNode,
  collapsedIds: ReadonlySet<string>,
): MindMapLayout {
  const nodes: PositionedNode[] = [];
  const edges: LayoutEdge[] = [];
  let cursorY = 0;

  function visit(node: MindMapNode, depth: number): PositionedNode {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isCollapsed = collapsedIds.has(node.id);
    const visibleKids = hasChildren && !isCollapsed ? node.children! : [];

    let y: number;
    const childPositions: PositionedNode[] = [];

    if (visibleKids.length === 0) {
      y = cursorY;
      cursorY += NODE_ROW_HEIGHT;
    } else {
      for (const kid of visibleKids) {
        childPositions.push(visit(kid, depth + 1));
      }
      const first = childPositions[0].y;
      const last = childPositions[childPositions.length - 1].y;
      y = (first + last) / 2;
    }

    const positioned: PositionedNode = {
      id: node.id,
      label: node.label,
      href: node.href,
      depth,
      x: -depth * LEVEL_WIDTH,
      y,
      hasChildren,
      collapsed: isCollapsed && hasChildren,
    };
    nodes.push(positioned);

    for (const child of childPositions) {
      edges.push({
        fromId: positioned.id,
        toId: child.id,
        x1: positioned.x,
        y1: positioned.y,
        x2: child.x,
        y2: child.y,
      });
    }

    return positioned;
  }

  visit(root, 0);

  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  return {
    nodes,
    edges,
    bounds: {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    },
  };
}

/** عدّ كل العقد المرئية حاليًا (تحترم الطيّ) — لعرض إحصاء صادق في الواجهة */
export function countVisibleNodes(root: MindMapNode, collapsedIds: ReadonlySet<string>): number {
  const isCollapsed = collapsedIds.has(root.id);
  if (isCollapsed || !root.children?.length) return 1;
  return 1 + root.children.reduce((acc, c) => acc + countVisibleNodes(c, collapsedIds), 0);
}
