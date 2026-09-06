/* ============================================================
   js/admin.js — shared admin-panel logic.
   Currently: ImgBB image upload helper.
   (Product CRUD helpers, order status helpers etc. can be added
   here later as the admin panel grows.)
   ============================================================ */

const IMGBB_API_KEY = "50e321961cde194d90cbf941cd472015"; // <-- আপনার key বসান
/* ============================================================
   Resize + convert any image (PNG/WEBP/HEIC-ish/etc.) to a
   compressed JPEG before uploading — smaller size, one
   consistent format, faster page loads on the storefront.
   ============================================================ */
function resizeAndConvertToJPEG(file, maxDimension = 1200, quality = 0.95) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // white background first — PNGs with transparency would
      // otherwise turn black when flattened to JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) { reject(new Error("Image processing failed.")); return; }
          const jpegFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, "") + ".jpg",
            { type: "image/jpeg" }
          );
          resolve(jpegFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read that image file."));
    };

    img.src = objectUrl;
  });
}
async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || "Image upload failed.");
  return data.data.url;
}