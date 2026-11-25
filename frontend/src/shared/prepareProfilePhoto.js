const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 60_000_000;
const OUTPUT_SIZE = 1024;
const MAX_OUTPUT_BYTES = 1024 * 1024;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Este formato de foto não pôde ser aberto. No iPhone, escolha uma imagem compatível ou use a opção Mais compatível da câmera."));
    image.src = url;
  });
}

function encodeJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Não foi possível converter a foto para JPEG neste navegador.")),
      "image/jpeg",
      quality,
    );
  });
}

export async function prepareProfilePhoto(file) {
  if (!(file.type?.startsWith("image/") || /\.(?:jpe?g|png|webp|hei[cf])$/i.test(file.name))) {
    throw new Error("Selecione uma imagem da câmera ou da galeria.");
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("Selecione uma foto de até 25 MB.");
  }

  const url = URL.createObjectURL(file);
  const canvas = document.createElement("canvas");

  try {
    const image = await loadImage(url);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height || width * height > MAX_SOURCE_PIXELS) {
      throw new Error("A foto tem resolução muito alta. Escolha uma versão menor.");
    }

    const sourceSize = Math.min(width, height);
    const sourceX = Math.round((width - sourceSize) / 2);
    const sourceY = Math.round((height - sourceSize) / 2);
    canvas.width = Math.min(OUTPUT_SIZE, sourceSize);
    canvas.height = canvas.width;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Não foi possível preparar a foto neste navegador.");
    }
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height);

    let blob = await encodeJpeg(canvas, .86);
    for (const quality of [.8, .74, .68]) {
      if (blob.size <= MAX_OUTPUT_BYTES) break;
      blob = await encodeJpeg(canvas, quality);
    }
    if (blob.type !== "image/jpeg" || blob.size > MAX_OUTPUT_BYTES) {
      throw new Error("Não foi possível reduzir a foto para envio. Escolha uma imagem menor.");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
  }
}
