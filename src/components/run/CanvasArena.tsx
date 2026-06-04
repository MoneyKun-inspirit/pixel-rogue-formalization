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

      if (effect.kind === "burst" && effect.radius) {
        context.strokeStyle = elementPalette[effect.element];
        context.lineWidth = 6;
        context.beginPath();
        context.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.35), 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = `${elementPalette[effect.element]}33`;
        context.beginPath();
        context.arc(effect.x, effect.y, effect.radius * 0.42, 0, Math.PI * 2);
        context.fill();
      }

      if (effect.kind === "steam" && effect.radius) {
        context.strokeStyle = "rgba(214, 238, 255, 0.85)";
        context.lineWidth = 8;
        context.beginPath();
        context.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.3), 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = "rgba(128, 214, 255, 0.65)";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(effect.x, effect.y, effect.radius * 0.66, 0, Math.PI * 2);
        context.stroke();
      }

      if (effect.kind === "shatter" && effect.radius) {
        context.strokeStyle = "rgba(228, 208, 106, 0.9)";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(effect.x - effect.radius * 0.22, effect.y - effect.radius * 0.22);
        context.lineTo(effect.x + effect.radius * 0.16, effect.y + effect.radius * 0.12);
        context.lineTo(effect.x - effect.radius * 0.06, effect.y + effect.radius * 0.26);
        context.stroke();
        context.strokeStyle = "rgba(128, 214, 255, 0.8)";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(effect.x + effect.radius * 0.08, effect.y - effect.radius * 0.24);
        context.lineTo(effect.x - effect.radius * 0.18, effect.y + effect.radius * 0.02);
        context.lineTo(effect.x + effect.radius * 0.24, effect.y + effect.radius * 0.24);
        context.stroke();
      }

      if (effect.kind === "melt" && effect.radius) {
        context.strokeStyle = "rgba(255, 122, 69, 0.85)";
        context.lineWidth = 4;
        context.strokeRect(effect.x - effect.radius, effect.y - effect.radius, effect.radius * 2, effect.radius * 2);
        context.strokeStyle = "rgba(255, 188, 120, 0.72)";
        context.beginPath();
        context.moveTo(effect.x - effect.radius * 0.6, effect.y - effect.radius * 0.55);
        context.lineTo(effect.x - effect.radius * 0.12, effect.y + effect.radius * 0.08);
        context.lineTo(effect.x + effect.radius * 0.52, effect.y + effect.radius * 0.5);
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
        if (projectile.splitGeneration !== undefined) {
          context.fillStyle = "#f8b4ff";
          context.fillRect(-6, -2, 4, 4);
        }
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

      if (projectile.source === "hero" && projectile.skillId === "seeker-blades") {
        const angle = Math.atan2(projectile.vy, projectile.vx);
        context.rotate(angle);
        context.fillStyle = elementPalette[projectile.element];
        context.fillRect(-3, -3, 18, 6);
        context.fillStyle = "#ffffff";
        context.fillRect(10, -2, 8, 4);
        if (projectile.splitGeneration !== undefined) {
          context.fillStyle = "#f8b4ff";
          context.fillRect(-8, -2, 4, 4);
        }
      }

      if (projectile.source === "hero" && projectile.skillId === "orbit-sigil") {
        context.fillStyle = elementPalette[projectile.element];
        context.fillRect(-9, -9, 18, 18);
        context.fillStyle = "#ffffff";
        context.fillRect(-3, -3, 6, 6);
      }

      if (projectile.source === "hero" && projectile.skillId === "lure-mine") {
        context.fillStyle = elementPalette[projectile.element];
        context.fillRect(-10, -10, 20, 20);
        context.fillStyle = "#1b1024";
        context.fillRect(-4, -4, 8, 8);
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

      if (enemy.status.elementState?.element === "fire") {
        context.strokeStyle = "rgba(255, 122, 69, 0.8)";
        context.lineWidth = 2;
        context.strokeRect(enemy.x - enemy.radius - 3, enemy.y - enemy.radius - 3, enemy.radius * 2 + 6, enemy.radius * 2 + 6);
      }

      if (enemy.status.elementState?.element === "ice") {
        context.strokeStyle = "rgba(128, 214, 255, 0.85)";
        context.lineWidth = 2;
        context.strokeRect(enemy.x - enemy.radius - 3, enemy.y - enemy.radius - 3, enemy.radius * 2 + 6, enemy.radius * 2 + 6);
      }

      if (enemy.status.meltedTimer > 0) {
        context.strokeStyle = "rgba(255, 180, 102, 0.95)";
        context.lineWidth = 3;
        context.strokeRect(enemy.x - enemy.radius - 6, enemy.y - enemy.radius - 6, enemy.radius * 2 + 12, enemy.radius * 2 + 12);
      }

      if (snapshot.heroId === "ranger" && snapshot.heroCore.ranger.markTargetId === enemy.id) {
        context.strokeStyle = "#72f3c7";
        context.lineWidth = 2;
        context.strokeRect(enemy.x - enemy.radius - 6, enemy.y - enemy.radius - 6, enemy.radius * 2 + 12, enemy.radius * 2 + 12);
        context.fillStyle = "#72f3c7";
        context.fillRect(enemy.x - 10, enemy.y - enemy.radius - 18, 20, 4);
        context.fillStyle = "#d7fff0";
        context.font = "11px 'Silkscreen', cursive";
        context.fillText(`${snapshot.heroCore.ranger.markStacks}`, enemy.x - 4, enemy.y - enemy.radius - 24);
      }
    });

    if (snapshot.heroId === "warrior") {
      const furyRatio = snapshot.heroCore.warrior.fury / snapshot.heroCore.warrior.maxFury;
      if (furyRatio > 0.05 || snapshot.heroCore.warrior.overdriveTimer > 0) {
        context.save();
        context.strokeStyle = snapshot.heroCore.warrior.overdriveTimer > 0 ? "#ff7a45" : "rgba(255,122,69,0.45)";
        context.lineWidth = snapshot.heroCore.warrior.overdriveTimer > 0 ? 5 : 3;
        context.beginPath();
        context.arc(snapshot.player.x, snapshot.player.y, 22 + furyRatio * 12, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }
    }

    if (snapshot.buildState.relicCloseRangeActive) {
      context.save();
      context.strokeStyle = "rgba(255, 122, 69, 0.7)";
      context.lineWidth = 4;
      context.beginPath();
      context.arc(snapshot.player.x, snapshot.player.y, 32, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (snapshot.buildState.relicElementFocus) {
      context.save();
      context.strokeStyle = `${elementPalette[snapshot.buildState.relicElementFocus]}99`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(snapshot.player.x, snapshot.player.y, 38, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (snapshot.buildState.relicStationaryCharge > 0.08) {
      context.save();
      context.strokeStyle = `rgba(180, 140, 255, ${0.18 + snapshot.buildState.relicStationaryCharge * 0.45})`;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(snapshot.player.x, snapshot.player.y, 48 + snapshot.buildState.relicStationaryCharge * 10, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (snapshot.heroId === "ranger") {
      const momentumRatio = snapshot.heroCore.ranger.momentum / snapshot.heroCore.ranger.momentumMax;
      if (momentumRatio > 0.05) {
        context.save();
        context.strokeStyle = `rgba(114, 243, 199, ${0.28 + momentumRatio * 0.42})`;
        context.lineWidth = 3;
        context.beginPath();
        context.arc(snapshot.player.x, snapshot.player.y, 24 + momentumRatio * 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * momentumRatio);
        context.stroke();
        context.restore();
      }

      if (snapshot.heroCore.ranger.markTargetId !== null) {
        const markedEnemy = snapshot.enemies.find((enemy) => enemy.id === snapshot.heroCore.ranger.markTargetId);
        if (markedEnemy) {
          context.save();
          context.strokeStyle = "rgba(114, 243, 199, 0.35)";
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(snapshot.player.x, snapshot.player.y);
          context.lineTo(markedEnemy.x, markedEnemy.y);
          context.stroke();
          context.restore();
        }
      }
    }

    context.fillStyle = snapshot.hero.color;
    context.fillRect(snapshot.player.x - 14, snapshot.player.y - 14, 28, 28);
    context.fillStyle = "#ffffff";
    context.fillRect(snapshot.player.x - 4, snapshot.player.y - 18, 8, 6);

    if (snapshot.heroId === "mage") {
      snapshot.heroCore.mage.sigils.forEach((sigil, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, snapshot.heroCore.mage.maxSigils) - Math.PI / 2;
        const orbitX = snapshot.player.x + Math.cos(angle) * 26;
        const orbitY = snapshot.player.y + Math.sin(angle) * 26;
        context.fillStyle = elementPalette[sigil];
        context.fillRect(orbitX - 5, orbitY - 5, 10, 10);
      });

      if (snapshot.heroCore.mage.resonanceTimer > 0) {
        context.strokeStyle = elementPalette[snapshot.heroCore.mage.resonanceElement];
        context.lineWidth = 3;
        context.beginPath();
        context.arc(snapshot.player.x, snapshot.player.y, 34, 0, Math.PI * 2);
        context.stroke();

        const resonanceProgress = snapshot.heroCore.mage.resonanceTimer / snapshot.heroCore.mage.resonanceDuration;
        context.strokeStyle = `${elementPalette[snapshot.heroCore.mage.resonanceElement]}99`;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(snapshot.player.x, snapshot.player.y, 44 + (1 - resonanceProgress) * 8, 0, Math.PI * 2);
        context.stroke();

        for (let index = 0; index < 4; index += 1) {
          const angle = snapshot.time * 2.4 + (Math.PI / 2) * index;
          const orbitX = snapshot.player.x + Math.cos(angle) * 42;
          const orbitY = snapshot.player.y + Math.sin(angle) * 42;
          context.save();
          context.translate(orbitX, orbitY);
          context.rotate(angle);
          context.fillStyle = elementPalette[snapshot.heroCore.mage.resonanceElement];
          context.fillRect(-4, -4, 8, 8);
          context.restore();
        }
      }
    }

    snapshot.floatingTexts.forEach((text) => {
      context.fillStyle = text.color;
      context.font = "12px 'Chakra Petch', sans-serif";
      context.fillText(text.value, text.x, text.y);
    });

    if (snapshot.mode === "levelup" || snapshot.mode === "relic-choice") {
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
