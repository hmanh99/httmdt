from abc import ABC, abstractmethod
import os
import uuid
import aiofiles
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
}


class StorageService(ABC):
    @abstractmethod
    async def upload_file(self, file: UploadFile, subfolder: str = "products") -> str:
        """Uploads a file and returns its public URL/path."""
        pass

    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Deletes a file given its path/URL."""
        pass


class LocalStorageService(StorageService):
    def __init__(self, base_dir: str = settings.UPLOAD_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    async def upload_file(self, file: UploadFile, subfolder: str = "products") -> str:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename cannot be empty.",
            )

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid MIME type '{file.content_type}'.",
            )

        # Target subfolder
        target_dir = os.path.join(self.base_dir, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        # Generate unique filename
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(target_dir, unique_name)

        # Save file asynchronously with size check
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        bytes_written = 0

        async with aiofiles.open(file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 64):  # 64KB chunks
                bytes_written += len(chunk)
                if bytes_written > max_bytes:
                    # Clean up partial file
                    await out_file.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                    )
                await out_file.write(chunk)

        # Return the public URL path
        return f"/static/uploads/{subfolder}/{unique_name}"

    async def delete_file(self, file_url: str) -> bool:
        if not file_url.startswith("/static/uploads/"):
            return False
        relative_path = file_url.replace("/static/uploads/", "", 1)
        full_path = os.path.join(self.base_dir, relative_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
                return True
            except OSError:
                return False
        return False


# Singleton instance
storage_service = LocalStorageService()
