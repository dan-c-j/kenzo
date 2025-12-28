from PIL import Image, ImageFilter
import os

def get_scaled_size(original_size, scale_factor):
    """Calculate the new size based on the original size and scale factor."""
    width, height = original_size
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)

    scale_factor_plus = 0.1

    while new_width > 400 or new_height > 400:
        new_width = int(width * (scale_factor - scale_factor_plus))
        new_height = int(height * (scale_factor - scale_factor_plus))
        scale_factor_plus += 0.1
        
        print(new_width)
        print(new_height)
        
    return (new_width, new_height)

def convert_to_webp(input_image_path, output_image_path, scale_factor=0.5, quality=80):
    """Convert an image to WebP format with resizing based on scale factor."""
    # Open the original image
    with Image.open(input_image_path) as img:
        # Get original size
        original_size = img.size
        
        # Calculate new size based on scale factor
        new_size = get_scaled_size(original_size, scale_factor)
        
        # Resize the image
        img = img.resize(new_size, Image.LANCZOS)  # Use LANCZOS for high-quality downsampling
        
        # Optionally apply a smoothing filter
        img = img.filter(ImageFilter.SMOOTH)

        # Save the image in WebP format
        img.save(output_image_path, format='WEBP', quality=quality)

if __name__ == "__main__":
    # Get the current directory
    directory = os.getcwd()

    # Set the scale factor (e.g., 0.3 for 30%, 0.8 for 80%)
    scale_factor = 0.35  # Change this value as needed

    # Loop through all files in the directory
    for filename in os.listdir(directory):
        if filename.endswith(".webp") and "thumbnail_" not in filename and "background_" not in filename:
            input_image = os.path.join(directory, filename)
            output_image = os.path.join(directory, f"thumbnail_{filename}")  # Prefix with 'resized_'

            # Convert the image
            convert_to_webp(input_image, output_image, scale_factor)

            print(f"Converted {input_image} to {output_image} with scale factor {scale_factor} and quality {80}.")
