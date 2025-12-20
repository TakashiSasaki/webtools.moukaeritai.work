# Agent Workflow Notes

## Image Conversion Workflow for Experiments
When the user provides large PNG files for experimental purposes, follow this workflow:

1.  **Resize**: Create smaller versions (e.g., target file size < 100KB) of the images. **Important**: Always preserve the original high-resolution files and save resized versions with a suffix like `_small.png`.
2.  **Multi-format Conversion**: From the resized (`_small`) images, generate the following formats to test browser compatibility and Clipboard API behavior:
    *   **WebP**: High compression modern standard.
    *   **JPG**: Standard lossy format.
    *   **GIF**: Legacy index-color format.
    *   **BMP**: Uncompressed Windows format.
    *   **ICO**: Windows icon container including multiple sizes (16x16, 32x32, 48x48, 64x64).
    *   **AVIF**: Next-generation high compression format (requires `pillow-avif-plugin`).
3.  **Verification**: Check file sizes and ensure they meet the experiment's requirements.
4.  **Version Control**: Commit the newly created files with clear, descriptive messages.

This process ensures a consistent set of test assets for the web tools in this repository.
