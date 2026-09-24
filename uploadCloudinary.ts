export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Kredensial Cloudinary belum diatur di .env.local");
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data.secure_url; // Mengembalikan URL gambar HTTPS dari Cloudinary
  } catch (error) {
    console.error("Gagal mengunggah file ke Cloudinary:", error);
    return null;
  }
};