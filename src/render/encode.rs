use crate::colour::Colour;
use image::{ImageBuffer, ImageError, Rgb};

/// Encoder handles image encoding.
pub struct Encoder<'a> {
    file_path: &'a str,
    imag_buff: ImageBuffer<Rgb<u8>, Vec<u8>>,
}

impl<'a> Encoder<'a> {
    /// Constructor.
    pub fn new(file_path: &str, width: u32, height: u32) -> Encoder {
        Encoder {
            file_path: file_path,
            imag_buff: ImageBuffer::new(width, height),
        }
    }

    /// put_pixel puts the provided pixel value into the image.
    pub fn put_pixel(&mut self, x: u32, y: u32, col: Colour) {
        // Data conversions.
        let (r, g, b) = col.to_255();

        // Write data.
        self.imag_buff.put_pixel(x, y, Rgb([r, g, b]))
    }

    /// save the image into the file.
    pub fn save(&self) -> Result<(), ImageError> {
        self.imag_buff.save(&self.file_path)
    }
}
