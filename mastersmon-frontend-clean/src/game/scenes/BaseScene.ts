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
    this.cameras.main.setBackgroundColor('#09111f');

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1630, 0x102340, 0x07101d, 0x07101d, 1);
    bg.fillRect(0, 0, width, height);

    const glow = this.add.circle(width * 0.2, height * 0.22, 180, this.accentColor, 0.12);
    const glow2 = this.add.circle(width * 0.8, height * 0.72, 220, 0x7a5cff, 0.08);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    glow2.setBlendMode(Phaser.BlendModes.SCREEN);

    this.add.text(36, 34, this.title, {
      fontSize: '34px',
      fontStyle: '700',
      color: '#ecf4ff'
    });

    this.add.text(36, 78, this.subtitle, {
      fontSize: '15px',
      color: '#9db4d1'
    });

    this.renderDecor(width, height);
  }

  renderDecor(width: number, height: number): void {
    const lane = this.add.rectangle(width * 0.5, height - 64, width - 64, 88, 0xffffff, 0.03);
    lane.setStrokeStyle(1, 0x86a7d0, 0.18);

    for (let index = 0; index < 5; index += 1) {
      const x = 70 + (index * ((width - 140) / 4));
      const card = this.add.rectangle(x, height - 64, 88, 52, 0xffffff, 0.045);
      card.setStrokeStyle(1, 0x86a7d0, 0.16);
    }
  }
}
