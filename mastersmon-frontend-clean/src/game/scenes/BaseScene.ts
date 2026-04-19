import Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  title: string;
  subtitle: string;
  accentColor: number;

  constructor(key: string, title: string, subtitle: string, accentColor: number) {
    super(key);
    this.title = title;
    this.subtitle = subtitle;
    this.accentColor = accentColor;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#07131d');

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x07131d, 0x0b2230, 0x031019, 0x031019, 1);
    bg.fillRect(0, 0, width, height);

    const ambient = this.add.graphics();
    ambient.fillStyle(this.accentColor, 0.12);
    ambient.fillCircle(width * 0.16, height * 0.18, 190);
    ambient.fillStyle(0x9c8cff, 0.08);
    ambient.fillCircle(width * 0.82, height * 0.16, 160);
    ambient.fillStyle(0xff8d78, 0.06);
    ambient.fillCircle(width * 0.72, height * 0.82, 220);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.04);
    for (let x = 0; x <= width; x += 76) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 76) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    grid.strokePath();

    const frame = this.add.graphics();
    frame.lineStyle(1, 0xa9d1df, 0.12);
    frame.strokeRoundedRect(20, 20, width - 40, height - 40, 28);

    const headline = this.add.text(42, 38, this.title, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '34px',
      fontStyle: '700',
      color: '#eff8f7'
    });
    headline.setShadow(0, 12, 'rgba(0,0,0,0.22)', 18, false, true);

    const sub = this.add.text(42, 84, this.subtitle, {
      fontFamily: 'IBM Plex Sans, sans-serif',
      fontSize: '15px',
      color: '#9fb4bc',
      wordWrap: { width: Math.max(260, width - 120) }
    });
    sub.setAlpha(0.92);

    this.renderDecor(width, height);
  }

  renderDecor(width: number, height: number): void {
    const rail = this.add.rectangle(width * 0.5, height - 76, width - 74, 116, 0xffffff, 0.03);
    rail.setStrokeStyle(1, 0xa9d1df, 0.14);

    const labels = ['roster', 'route', 'boss', 'idle', 'shop'];
    labels.forEach((label, index) => {
      const x = 70 + (index * ((width - 140) / Math.max(1, labels.length - 1)));
      const card = this.add.rectangle(x, height - 76, 104, 64, 0xffffff, 0.045);
      card.setStrokeStyle(1, 0xa9d1df, 0.12);

      const marker = this.add.text(x, height - 84, label, {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '12px',
        color: '#c7d9de'
      });
      marker.setOrigin(0.5);
    });

    const pulse = this.add.circle(width - 84, height - 84, 18, this.accentColor, 0.9);
    pulse.setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: pulse,
      scale: { from: 0.92, to: 1.14 },
      alpha: { from: 0.82, to: 0.28 },
      duration: 1700,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });
  }
}
