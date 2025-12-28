import os
from PIL import Image

def create_thumbnail(image_path, thumbnail_size=(960, 960)):
    """Create a thumbnail for the given image."""
    with Image.open(image_path) as img:
        img.thumbnail(thumbnail_size)
        # Create a new filename for the thumbnail
        base_name = os.path.basename(image_path)
        name, _ = os.path.splitext(base_name)
        
        
        thumbnail_path = os.path.join(os.path.dirname(image_path), f"background_{name}.webp")
        img.save(thumbnail_path, "WEBP")
        print(f"Thumbnail saved: {thumbnail_path}")

def generate_thumbnails_in_directory(directory):
    """Generate thumbnails for all WebP images in the specified directory."""
    for filename in os.listdir(directory):
        if filename.lower().endswith('.webp') and "thumbnail" not in filename and "background" not in filename:
            image_path = os.path.join(directory, filename)
            create_thumbnail(image_path)

if __name__ == "__main__":
    current_directory = os.getcwd()  # Get the current working directory
    generate_thumbnails_in_directory(current_directory)
