const MAX_ORIGINAL = 16 * 1024 * 1024;
export async function compressAssessmentPhoto(file) {
  if (!/\.jpe?g$/i.test(file.name) || (file.type && file.type !== "image/jpeg")) throw new Error("Selecione uma foto JPG ou JPEG.");
  if (file.size > MAX_ORIGINAL) throw new Error("Selecione uma foto de até 16 MB.");
  const url = URL.createObjectURL(file);
  const picture = new Image();
  const canvas = document.createElement("canvas");
  try {
    picture.src = url;
    await picture.decode();
    if (!picture.naturalWidth || picture.naturalWidth * picture.naturalHeight > 60_000_000) throw new Error("A foto tem resolução muito alta. Exporte uma versão menor.");
    const scale = Math.min(1, 1600 / Math.max(picture.naturalWidth, picture.naturalHeight));
    canvas.width = Math.max(1, Math.round(picture.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(picture.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a foto neste navegador.");
    context.drawImage(picture, 0, 0, canvas.width, canvas.height);
    const encode = (quality) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao comprimir a foto.")), "image/jpeg", quality));
    let blob = await encode(.86);
    for (const quality of [.8, .74, .68]) {
      if (blob.size <= 600 * 1024) break;
      blob = await encode(quality);
    }
    if (blob.type !== "image/jpeg" || blob.size > 1024 * 1024) throw new Error("Não foi possível reduzir a foto para 1 MB preservando a qualidade. Escolha uma versão menor.");
    return { blob, originalBytes: file.size };
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = 0; canvas.height = 0;
  }
}

