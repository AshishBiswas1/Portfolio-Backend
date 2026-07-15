const cloudinary = require('cloudinary').v2;

exports.deleteFromCloudinary = async (url, resourceType = 'auto') => {
  if (!url || !url.includes('cloudinary.com')) return;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return;
    
    const pathWithVersion = parts[1];
    const pathWithoutVersion = pathWithVersion.substring(pathWithVersion.indexOf('/') + 1);
    const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
    
    console.log(`Destroying old Cloudinary asset: ${publicId} (${resourceType})`);
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (err) {
    console.error('Failed to delete old asset from Cloudinary:', err);
  }
};
