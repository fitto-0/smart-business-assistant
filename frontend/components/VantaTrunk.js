import { useEffect, useRef } from 'react';

export default function VantaTrunk() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    // Wait for libraries to load
    const initVanta = () => {
      if (typeof window !== 'undefined' && window.VANTA && vantaRef.current) {
        console.log('Initializing Vanta Trunk...');
        vantaEffect.current = window.VANTA.TRUNK({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: 0xF1E9DC, // Light canvas - matches the light theme
          color: 0x1C352D, // Forest green
          chaos: 1.5,
          spacing: 0,
        });
        console.log('Vanta Trunk initialized successfully');
      }
    };

    // Try to initialize immediately, otherwise wait for load
    initVanta();
    const timeoutId = setTimeout(initVanta, 200);

    return () => {
      clearTimeout(timeoutId);
      if (vantaEffect.current) {
        try {
          vantaEffect.current.destroy();
        } catch (error) {
          console.warn('Vanta destroy error:', error);
        }
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="w-full h-full"
      style={{ minHeight: '600px', backgroundColor: '#F1E9DC' }}
    />
  );
}