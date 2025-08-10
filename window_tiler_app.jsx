import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

let idCounter = 0;

const getRandomColor = () => `hsl(${Math.random() * 360}, 70%, 80%)`;
const getRandomPosition = () => ({
  x: Math.random() * (window.innerWidth - 300),
  y: Math.random() * (window.innerHeight - 200),
});

const SNAP_THRESHOLD = 30;

const Window = ({ id, color, onClose, onSnapCheck, snapStyle, parentBounds }) => {
  const [position, setPosition] = useState(getRandomPosition());
  const [isSnapped, setIsSnapped] = useState(false);
  const ref = useRef(null);

  const handleDragEnd = (e, info) => {
    const x = info.point.x;
    const y = info.point.y;

    const bounds = parentBounds || { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
    const relX = x - bounds.x;
    const relY = y - bounds.y;

    const snap = {};

    if (relX < SNAP_THRESHOLD) snap.side = 'left';
    else if (relX > bounds.width - SNAP_THRESHOLD) snap.side = 'right';
    else if (relY < SNAP_THRESHOLD) snap.side = 'top';
    else if (relY > bounds.height - SNAP_THRESHOLD) snap.side = 'bottom';

    if (snap.side) {
      setIsSnapped(true);
      onSnapCheck(id, snap.side, bounds);
    } else {
      setIsSnapped(false);
      setPosition({ x, y });
    }
  };

  return (
    <motion.div
      ref={ref}
      className="absolute rounded-xl shadow-lg overflow-hidden"
      style={{
        backgroundColor: color,
        zIndex: id,
        ...(!isSnapped ? { width: 288, height: 192 } : {}),
        ...(isSnapped ? snapStyle : position),
        transition: 'all 0.3s ease'
      }}
      drag={!isSnapped}
      dragConstraints={{ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={!isSnapped ? position : {}}
    >
      <div className="flex justify-between items-center px-3 py-1 bg-black/20 cursor-move">
        <span className="font-medium text-sm">Window #{id}</span>
        <button
          className="text-xs bg-red-500 text-white px-2 rounded"
          onClick={() => onClose(id)}
        >
          ✕
        </button>
      </div>
      <div className="p-3 text-sm text-gray-700">{isSnapped ? 'Snapped!' : 'Drag me around'}</div>
    </motion.div>
  );
};

export default function App() {
  const [windows, setWindows] = useState([]);
  const [snapOverlay, setSnapOverlay] = useState(null);

  const addWindow = (parentBounds = null) => {
    const newWindow = {
      id: ++idCounter,
      color: getRandomColor(),
      snapStyle: null,
      parentBounds
    };
    setWindows(prev => [...prev, newWindow]);
  };

  const closeWindow = (id) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleSnap = (id, side, bounds) => {
    const snappedStyle = {
      top: side === 'top' ? bounds.y : side === 'bottom' ? bounds.y + bounds.height / 2 : bounds.y,
      left: side === 'left' ? bounds.x : side === 'right' ? bounds.x + bounds.width / 2 : bounds.x,
      width: side === 'top' || side === 'bottom' ? bounds.width : bounds.width / 2,
      height: side === 'left' || side === 'right' ? bounds.height : bounds.height / 2,
      position: 'absolute'
    };

    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, snapStyle: snappedStyle, parentBounds: bounds } : w
    ));

    // Automatically allow nested snapping by treating snapped region as parent bounds
    addWindow({
      x: snappedStyle.left,
      y: snappedStyle.top,
      width: snappedStyle.width,
      height: snappedStyle.height
    });
  };

  const renderSnapOverlay = () => {
    if (!snapOverlay) return null;
    const sideClass = {
      top: 'top-0 left-0 w-full h-[30px]',
      bottom: 'bottom-0 left-0 w-full h-[30px]',
      left: 'top-0 left-0 w-[30px] h-full',
      right: 'top-0 right-0 w-[30px] h-full',
    }[snapOverlay];

    return <div className={`absolute bg-blue-300/30 pointer-events-none ${sideClass}`} />;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientX < SNAP_THRESHOLD) setSnapOverlay('left');
      else if (e.clientX > window.innerWidth - SNAP_THRESHOLD) setSnapOverlay('right');
      else if (e.clientY < SNAP_THRESHOLD) setSnapOverlay('top');
      else if (e.clientY > window.innerHeight - SNAP_THRESHOLD) setSnapOverlay('bottom');
      else setSnapOverlay(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-100 relative overflow-hidden">
      {renderSnapOverlay()}
      {windows.map(win => (
        <Window
          key={win.id}
          id={win.id}
          color={win.color}
          onClose={closeWindow}
          onSnapCheck={handleSnap}
          snapStyle={win.snapStyle}
          parentBounds={win.parentBounds}
        />
      ))}
      <button
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700"
        onClick={() => addWindow()}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
