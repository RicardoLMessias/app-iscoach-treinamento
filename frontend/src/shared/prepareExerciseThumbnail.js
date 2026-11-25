const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 60_000_000;

export async function prepareExerciseThumbnail(file) {
  if (!(file.type?.startsWith("image/") || /\.(?:jpe?g|png|webp|hei[cf])$/i.test(file.name))) {
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  }
  if (file.size > MAX_ORIGINAL_BYTES) throw new Error("Escolha uma imagem de até 25 MB.");

  const url = URL.createObjectURL(file);
  const canvas = document.createElement("canvas");
  const picture = new Image();
  try {
    picture.src = url;
    await picture.decode().catch(() => { throw new Error("Este formato não pôde ser aberto. Escolha uma imagem JPG, PNG ou WebP."); });
    const width = picture.naturalWidth;
    const height = picture.naturalHeight;
    if (!width || !height || width * height > MAX_SOURCE_PIXELS) throw new Error("A imagem tem resolução muito alta. Escolha uma versão menor.");

    canvas.width = 960;
    canvas.height = 540;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a miniatura neste navegador.");
    const cropWidth = Math.min(width, height * 16 / 9);
    const cropHeight = Math.min(height, width * 9 / 16);
    context.drawImage(picture, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, 960, 540);

    for (const quality of [.86, .78, .7]) {
      const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Não foi possível converter a miniatura.")), "image/jpeg", quality));
      if (blob.size <= 1024 * 1024) return blob;
    }
    throw new Error("Não foi possível reduzir a miniatura para 1 MB. Escolha outra imagem.");
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
  }
}
