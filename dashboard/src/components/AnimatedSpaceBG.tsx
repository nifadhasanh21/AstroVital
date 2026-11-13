import { useEffect, useRef } from 'react';

export const AnimatedSpaceBG = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Create layered stars for parallax
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.01 + 0.002,
      layer: Math.floor(Math.random() * 3) + 1, // 1, 2, or 3
    }));

    interface ShootingStar {
      x: number; y: number; len: number; speed: number; angle: number; life: number; maxLife: number;
    }
    const shootingStars: ShootingStar[] = [];
    let nextShot = 2000;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const render = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = time * 0.0001;

      // Deep Space Gradient
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.3, 50, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
      grad.addColorStop(0, '#0a1636');
      grad.addColorStop(0.5, '#04091a');
      grad.addColorStop(1, '#010206');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Drifting Nebula
      ctx.save();
      ctx.globalAlpha = 0.15;
      const nebulaX = w * 0.8 + Math.sin(t) * 100;
      const nebulaY = h * 0.2 + Math.cos(t * 1.5) * 80;
      const nebGrad = ctx.createRadialGradient(nebulaX, nebulaY, 10, nebulaX, nebulaY, 400);
      nebGrad.addColorStop(0, 'rgba(14, 165, 233, 0.8)');
      nebGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.3)');
      nebGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebGrad;
      ctx.beginPath();
      ctx.arc(nebulaX, nebulaY, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Earth Horizon Glow at bottom
      const earthGlow = ctx.createRadialGradient(w * 0.5, h + 200, 50, w * 0.5, h + 200, w * 0.8);
      earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
      earthGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.05)');
      earthGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = earthGlow;
      ctx.fillRect(0, h - 400, w, 400);

      // Stars
      stars.forEach((s) => {
        s.alpha += s.speed;
        if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
        
        // Slow parallax drift
        s.x += s.layer * 0.02;
        if (s.x > w) s.x = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        
        if (s.layer === 3) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(s.alpha)})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#38bdf8';
        } else {
          ctx.fillStyle = `rgba(186, 230, 253, ${Math.abs(s.alpha) * 0.7})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Shooting Stars
      if (time > nextShot) {
        shootingStars.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.4,
          len: 80 + Math.random() * 100,
          speed: 6 + Math.random() * 4,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          life: 0,
          maxLife: 60,
        });
        nextShot = time + 4000 + Math.random() * 5000;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.life++;
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        
        const fade = 1 - star.life / star.maxLife;
        if (fade <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = star.x - Math.cos(star.angle) * star.len;
        const tailY = star.y - Math.sin(star.angle) * star.len;

        const lineGrad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        lineGrad.addColorStop(1, `rgba(255, 255, 255, ${fade})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.85 }} />;
};