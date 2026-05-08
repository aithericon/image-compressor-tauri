use std::path::Path;
use image::{DynamicImage, RgbImage, RgbaImage};
use libheif_rs::{ColorSpace, HeifContext, LibHeif, RgbChroma};

/// Decode an HEIC/HEIF file into a `DynamicImage`.
///
/// libheif handles orientation metadata internally during decode, so the returned
/// image is upright relative to the source camera capture.
pub fn decode_heic(path: &Path) -> Result<DynamicImage, String> {
    let path_str = path
        .to_str()
        .ok_or_else(|| format!("HEIC path is not valid UTF-8: {}", path.display()))?;

    let lib_heif = LibHeif::new();
    let ctx = HeifContext::read_from_file(path_str)
        .map_err(|e| format!("Failed to read HEIC file: {}", e))?;
    let handle = ctx
        .primary_image_handle()
        .map_err(|e| format!("Failed to get primary HEIC image: {}", e))?;

    let has_alpha = handle.has_alpha_channel();
    let chroma = if has_alpha {
        RgbChroma::Rgba
    } else {
        RgbChroma::Rgb
    };

    let image = lib_heif
        .decode(&handle, ColorSpace::Rgb(chroma), None)
        .map_err(|e| format!("Failed to decode HEIC image: {}", e))?;

    let width = image.width();
    let height = image.height();
    let planes = image.planes();
    let plane = planes
        .interleaved
        .ok_or_else(|| "HEIC decoder returned no interleaved plane".to_string())?;

    let stride = plane.stride;
    let src = plane.data;
    let bpp = if has_alpha { 4 } else { 3 };
    let row_bytes = (width as usize) * bpp;

    let mut buffer = Vec::with_capacity(row_bytes * height as usize);
    for y in 0..height as usize {
        let start = y * stride;
        let end = start + row_bytes;
        if end > src.len() {
            return Err(format!(
                "HEIC decoded buffer too small (row {} stride {} expected {})",
                y, stride, end
            ));
        }
        buffer.extend_from_slice(&src[start..end]);
    }

    if has_alpha {
        let img = RgbaImage::from_raw(width, height, buffer)
            .ok_or_else(|| "Failed to construct RGBA image from HEIC pixel data".to_string())?;
        Ok(DynamicImage::ImageRgba8(img))
    } else {
        let img = RgbImage::from_raw(width, height, buffer)
            .ok_or_else(|| "Failed to construct RGB image from HEIC pixel data".to_string())?;
        Ok(DynamicImage::ImageRgb8(img))
    }
}

/// Whether a path's extension is HEIC/HEIF.
pub fn is_heic_path(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let lower = ext.to_lowercase();
            lower == "heic" || lower == "heif"
        })
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn fixture(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join(name)
    }

    #[test]
    fn is_heic_path_recognises_heic_and_heif() {
        assert!(is_heic_path(Path::new("foo.heic")));
        assert!(is_heic_path(Path::new("foo.HEIC")));
        assert!(is_heic_path(Path::new("foo.heif")));
        assert!(!is_heic_path(Path::new("foo.jpg")));
        assert!(!is_heic_path(Path::new("foo")));
    }

    #[test]
    fn decodes_sample_heic_to_dynamic_image() {
        let path = fixture("sample.heic");
        assert!(path.exists(), "missing fixture at {}", path.display());

        let img = decode_heic(&path).expect("decode_heic should succeed on fixture");
        assert!(img.width() > 0, "decoded width should be > 0");
        assert!(img.height() > 0, "decoded height should be > 0");
    }
}
