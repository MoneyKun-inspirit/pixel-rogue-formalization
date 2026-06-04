import { useEffect, useRef } from "react";
import { ARENA_HEIGHT, ARENA_WIDTH, elementPalette } from "@/game/content";
import type { RunSnapshot } from "@/game/types";

interface CanvasArenaProps {
  snapshot: RunSnapshot;
}

export function CanvasArena({ snapshot }: CanvasArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    context.fillStyle = "#090b17";
    context.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    for (let x = 0; x < ARENA_WIDTH; x += 32) {
      for (let y = 0; y < ARENA_HEIGHT; y += 32) {
        context.fillStyle = (x + y) % 64 === 0 ? "#11152a" : "#0d1222";
        context.fillRect(x, y, 30, 30);
      }
    }

    context.strokeStyle = "rgba(128, 214, 255, 0.1)";
    context.strokeRect(14, 14, ARENA_WIDTH - 28, ARENA_HEIGHT - 28);

    snapshot.attackEffects.forEach((effect) => {
      const progress = effect.ttl / effect.maxTtl;
      context.save();
      context.globalAlpha = Math.max(0.18, progress);

      if (effect.kind === "slash" && effect.radius && effect.angle !== undefined) {
        context.translate(effect.x, effect.y);
        context.rotate(effect.angle);
        context.fillStyle = elementPalette[effect.element];
        context.fillRect(14, -8, effect.radius, 16);
        context.fillStyle = "rgba(255,255,255,0.7)";
        context.fillRect(18, -3, effect.radius * 0.6, 6);
      }

      if (effect.kind === "nova" && effect.radius) {
        context.strokeStyle = elementPalette[effect.element];
        context.lineWidth = 8;
        context.beginPath();
        context.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.45), 0, Math.PI * 2);
        context.stroke();
      }

      if (effect.kind === "lance" && effect.radius && effect.angle !== undefined) {
        context.translate(effect.x, effect.y);
        context.rotate(effect.angle);
        context.fillStyle = "#d4f6ff";
        context.fillRect(8, -4, effect.radius, 8);
        context.fillStyle = "#7fd8ff";
        context.fillRect(effect.radius + 8, -7, 14, 14);
      }

      if (effect.kind === "lightning" && effect.targetX !== undefined && effect.targetY !== undefined) {
        context.strokeStyle = elementPalette.lightning;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(effect.x, effect.y);
        context.lineTo(effect.targetX - 10, effect.targetY - 26);
        context.lineTo(effect.targetX + 6, effect.targetY - 8);
        context.lineTo(effect.targetX - 2, effect.targetY + 10);
        context.stroke();
      }

      context.restore();
    });

    snapshot.projectiles.forEach((projectile) => {
      context.save();
      context.translate(projectile.x, projectile.y);

      if (projectile.source === "enemy") {
        context.fillStyle = "#ff9a96";
        context.beginPath();
        context.arc(0, 0, projectile.radius, 0, Math.PI * 2);
        context.fill();
      }

      if (projectile.source === "hero" && projectile.skillId === "ricochet-shot") {
        const angle = Math.atan2(projectile.vy, projectile.vx);
        context.rotate(angle);
        context.fillStyle = elementPalette[projectile.element];
        context.fillRect(-2, -2, 20, 4);
        context.fillStyle = "#ffffff";
        context.fillRect(10, -3, 8, 6);
      }

      if (projectile.source === "hero" && projectile.skillId === "arcane-orb") {
        context.fillStyle = elementPalette[projectile.element];
        context.fillRect(-10, -10, 20, 20);
        context.fillStyle = "#ffffff";
        context.fillRect(-4, -4, 8, 8);
      }

      if (projectile.source === "hero" && projectile.skillId === "frost-lance") {
        const angle = Math.atan2(projectile.vy, projectile.vx);
        context.rotate(angle);
        context.fillStyle = "#c6f6ff";
        context.fillRect(-2, -3, 18, 6);
        context.fillStyle = "#7fd8ff";
        context.fillRect(14, -6, 10, 12);
      }

      context.restore();
    });

    snapshot.enemies.forEach((enemy) => {
      const color = enemy.status.shockTimer > 0 ? "#f4dd7d" : enemy.color;
      context.fillStyle = color;
      context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
      context.fillStyle = "#1f2436";
      context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2, 4);
      context.fillStyle = "#fe7272";
      context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, (enemy.hp / enemy.maxHp) * enemy.radius * 2, 4);
    });

    context.fillStyle = snapshot.hero.color;
    context.fillRect(snapshot.player.x - 14, snapshot.player.y - 14, 28, 28);
    context.fillStyle = "#ffffff";
    context.fillRect(snapshot.player.x - 4, snapshot.player.y - 18, 8, 6);

    snapshot.floatingTexts.forEach((text) => {
      context.fillStyle = text.color;
      context.font = "12px 'Chakra Petch', sans-serif";
      context.fillText(text.value, text.x, text.y);
    });

    if (snapshot.mode === "levelup") {
      context.fillStyle = "rgba(4, 8, 18, 0.55)";
      context.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    }
  }, [snapshot]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-cyan-200/15 bg-[#080b17] p-3 shadow-[0_0_0_1px_rgba(110,231,255,0.04),0_30px_80px_rgba(2,8,24,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_18%,transparent_82%,rgba(255,255,255,0.04))]" />
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        className="w-full rounded-[20px] border border-white/6 bg-[#080b17] [image-rendering:pixelated]"
      />
    </div>
  );
}
