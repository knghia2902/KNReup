export function calculateSubtitleLayout(segments: any[], projectConfig: any, videoDimensions: {w: number, h: number}) {
  const canvas = document.createElement('canvas');
  let effectiveW = videoDimensions.w || 1920;
  let effectiveH = videoDimensions.h || 1080;

  if (projectConfig.video_ratio === '16:9') {
    effectiveW = 1920; effectiveH = 1080;
  } else if (projectConfig.video_ratio === '9:16') {
    effectiveW = 1080; effectiveH = 1920;
  }
  
  canvas.width = effectiveW;
  canvas.height = effectiveH;
  
  const ctx = canvas.getContext('2d');
  if (!ctx || !segments || segments.length === 0) return segments;

  let fontFamily = projectConfig.subtitle_font || 'sans-serif';
  let scaledFontSize = (projectConfig.subtitle_font_size || 50) * (canvas.height / 1080.0);
  ctx.font = `bold ${scaledFontSize}px "${fontFamily}", sans-serif`;

  const isPosLegacy = projectConfig.subtitle_y !== undefined && projectConfig.subtitle_y > 100;
  const isSizeLegacy = (projectConfig.subtitle_w !== undefined && projectConfig.subtitle_w > 100);

  const safeNx = (val: number | undefined, df: number) => { const v = val ?? df; return isPosLegacy ? (v / 1080) * 100 : v; };
  const safeNy = (val: number | undefined, df: number) => { const v = val ?? df; return isPosLegacy ? (v / 1920) * 100 : v; };
  const safeNw = (val: number | undefined, df: number) => { const v = val ?? df; return isSizeLegacy ? (v / 1080) * 100 : v; };
  const safeNh = (val: number | undefined, df: number) => { const v = val ?? df; return isSizeLegacy ? (v / 1920) * 100 : v; };

  const subX = safeNx(projectConfig.subtitle_x, 5);
  const subY = safeNy(projectConfig.subtitle_y, 80);
  let subW = safeNw(projectConfig.subtitle_w, 90);
  let subH = safeNh(projectConfig.subtitle_h, 15);

  if (subX + subW > 100) subW = Math.max(5, 100 - subX);
  if (subY + subH > 100) subH = Math.max(5, 100 - subY);

  const boxWidth = (subW / 100) * canvas.width;
  const boxHeight = (subH / 100) * canvas.height;
  const boxX = (subX / 100) * canvas.width;
  const boxY = (subY / 100) * canvas.height;
  
  const boxCenterX = boxX + boxWidth / 2;
  const boxCenterY = boxY + boxHeight / 2;
  
  // Keep parity with Canvas Text layout rendering
  const textMaxWidth = boxWidth - scaledFontSize * 0.2;
  const measure = (textLine: string) => ctx.measureText(textLine).width;

  const getGreedyLines = (textStr: string): string[] => {
    const words = textStr.split(' ');
    let currentLines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (measure(testLine) <= textMaxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) currentLines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) currentLines.push(currentLine);
    return currentLines;
  };

  const lineHeight = scaledFontSize * 1.15;

  return segments.map(seg => {
    let text = seg.translated_text || seg.source_text || "";
    text = text.trim();
    if (text) text = text.charAt(0).toUpperCase() + text.slice(1);
    
    if (!text) return seg;

    const allLines = text.split('\n').flatMap((l: string) => getGreedyLines(l));
    const startY = boxCenterY - ((allLines.length - 1) / 2) * lineHeight;

    const preciseLines = allLines.map((lineText: string, idx: number) => ({
      text: lineText,
      x: boxCenterX,
      y: startY + idx * lineHeight
    }));

    return {
      ...seg,
      exact_layout: {
        lines: preciseLines,
        fontSize: scaledFontSize,
        outlineWidth: Math.max(2, scaledFontSize * 0.16),
        color: projectConfig.subtitle_color || '#FFFF00',
        outlineColor: projectConfig.subtitle_outline_color || '#000000',
      }
    };
  });
}
