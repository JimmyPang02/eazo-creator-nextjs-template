// nodes.jsx — Node, Connections, ChatBubble

const { useState, useEffect, useRef } = React;

/* ─── NODE ───────────────────────────────────────────── */
function Node({ node, onClick, onLongPress, onDrag }) {
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0, timer: null });

  const onPointerDown = (e) => {
    if (e.target.closest('[data-no-drag]')) return;
    e.stopPropagation();
    drag.current = {
      down: true, moved: false,
      sx: e.clientX, sy: e.clientY,
      ox: node.x, oy: node.y, timer: null
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (node.id !== 'root') {
      drag.current.timer = setTimeout(() => {
        if (drag.current.down && !drag.current.moved) {
          onLongPress(node);
          drag.current.down = false;
        }
      }, 600);
    }
  };
  const onPointerMove = (e) => {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (!drag.current.moved && Math.hypot(dx, dy) > 5) {
      drag.current.moved = true;
      clearTimeout(drag.current.timer);
    }
    if (drag.current.moved) {
      onDrag(node, drag.current.ox + dx, drag.current.oy + dy);
    }
  };
  const onPointerUp = (e) => {
    clearTimeout(drag.current.timer);
    if (drag.current.down && !drag.current.moved) {
      onClick(node);
    }
    drag.current.down = false;
  };

  const cls = [
    'node',
    node.id === 'root' ? 'root' : node.state,
    node.mirror ? 'mirror' : '',
    node.fresh ? 'fresh' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ left: node.x, top: node.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {node.memBadge && <div className="node-mem">匹配你的偏好</div>}
      {node.id !== 'root' && (
        <div className={'node-source ' + (node.from === 'user' ? 'user' : '')}>
          <span className="tick"></span>
          {node.from === 'user' ? '你提出' : 'AI 生成'} · 第 {node.layer} 层
        </div>
      )}
      {node.id === 'root' && (
        <div className="node-source">
          <span className="tick"></span>
          根题 · 你的出发点
        </div>
      )}
      <div className="node-title">{node.title}</div>
      {node.state !== 'drift' && <div className="node-desc">{node.desc}</div>}
    </div>
  );
}

/* ─── CONNECTIONS ────────────────────────────────────── */
function Connections({ nodes }) {
  if (nodes.length === 0) return null;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs, 0) - 240;
  const maxX = Math.max(...xs, 0) + 240;
  const minY = Math.min(...ys, 0) - 120;
  const maxY = Math.max(...ys, 0) + 200;
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <svg
      className="edges"
      style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY }}
    >
      {nodes.filter(n => n.parent).map(n => {
        const p = byId[n.parent];
        if (!p) return null;
        const x1 = p.x - minX;
        const y1 = p.y - minY - 44;        // TOP of parent (tree grows up)
        const x2 = n.x - minX;
        const y2 = n.y - minY + 44;        // BOTTOM of child
        const mid = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
        let cls = 'edge';
        if (n.state === 'drift') cls += ' dim';
        else if ((n.state === 'selected' || p.id === 'root') && p.state !== 'drift') cls += ' spine';
        return <path key={n.id} d={d} className={cls} />;
      })}
    </svg>
  );
}

/* ─── CHAT BUBBLE ────────────────────────────────────── */
const ELABS = {
  root: '题面有不少切入口：从注意力本身、从动机系统、从环境氛围。我已经发散了 4 个方向——你被"视觉化专注泡泡"吸引了。',
  a: '把抽象的注意力做成屏幕里可见的物体，是给 ADHD 用户最稳的钩子。我又往下分了 4 条路径，你选择了"朋友式陪伴"。',
  a2: '"在场感"比"监督感"更重要。朋友式陪伴不评价、只在场，能避开你提过的"负反馈敏感"那个雷区。',
  default: '点击下面的快捷追问，或在这里向我提出你自己的问题——我会基于你的偏好和已选路径回答。'
};

const REPLIES = {
  root: [
    { q: '为什么先选这条？', a: '注意力的"具身化"对你过去做的"情绪日记"产品风格也很契合——把抽象做成可感知的物体。' },
    { q: '另外三条还能复活吗？', a: '可以。它们在左侧的"想法篮子"里，随时拖回画布。' }
  ],
  a: [
    { q: '泡泡的视觉到底长什么样？', a: '可以是会"呼吸"的半透明球体，专注时缓慢膨胀，分心时表面起涟漪。给你画几个草图？' },
    { q: '会不会让用户更焦虑？', a: '关键是不要做成"成就感量化"，而是做成"陪伴物"。所以下层我才会优先推"朋友式陪伴"。' }
  ],
  a2: [
    { q: '"陪伴"和"监督"的边界在哪？', a: '陪伴的关键词是"在场、不打分、不打断"，监督会带评价。设计时让伴学没有"对错"行为。' },
    { q: '可以让 AI 默不作声吗？', a: '可以，三层都能调。默认是"低语"模式，每 5 分钟出现一次。' }
  ]
};

function ChatBubble({ node, onClose, onAsk }) {
  const [input, setInput] = useState('');
  const [thread, setThread] = useState([]);

  if (!node) return null;

  const elab = ELABS[node.id] || ELABS.default;
  const presetReplies = REPLIES[node.id] || [];

  const submit = (text) => {
    if (!text.trim()) return;
    const fakeReply = `已经把"${text.trim().slice(0, 14)}"接到这个分支下，3 个新想法已经长出来了——往下看。`;
    setThread(t => [...t, { q: text.trim(), a: fakeReply }]);
    setInput('');
    onAsk(node, text.trim());
  };

  // position bubble to the right of node
  const left = node.x + (node.id === 'root' ? 150 : 145);
  const top = node.y - 60;

  return (
    <div className="bubble" style={{ left, top }} data-no-drag>
      <div className="bubble-head">
        <span>聚焦 · <span className="focused">{node.title}</span></span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="bubble-body">{elab}</div>
      {presetReplies.length > 0 && thread.length === 0 && (
        <div className="bubble-replies">
          {presetReplies.map((r, i) => (
            <div key={i} className="bubble-reply">
              <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 3, fontSize: 12 }}>{r.q}</strong>
              {r.a}
            </div>
          ))}
        </div>
      )}
      {thread.map((m, i) => (
        <div key={i} className="bubble-reply">
          <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 3, fontSize: 12 }}>{m.q}</strong>
          {m.a}
        </div>
      ))}
      <div className="bubble-chips">
        <button className="chip" onClick={() => submit('再发散 3 个变体')} title="基于这条思路再延展 3 个相似变体">+ 3 个变体</button>
        <button className="chip" onClick={() => submit('反向思路')} title="用反向 / 接纳 / 删减的角度，长出 3 个相反方向">+ 反向思路</button>
        <button className="chip" onClick={() => submit('跨维度发散')} title="跨出当前维度，从声音 / 时间 / 身体长出 3 个新枝">+ 跨维度</button>
      </div>
      <div className="bubble-input">
        <input
          placeholder="向 AI 追问关于这个节点..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(input); }}
        />
        <button onClick={() => submit(input)}>→</button>
      </div>
    </div>
  );
}

Object.assign(window, { TreeNode: Node, Connections, ChatBubble });
