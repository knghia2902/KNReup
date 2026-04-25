"""System check endpoint — dependency checker."""
from fastapi import APIRouter
from app.utils.gpu_detect import detect_all_dependencies

router = APIRouter()


@router.get("/system/check")
async def check_dependencies():
    """Kiểm tra tất cả dependencies (GPU, FFmpeg, etc.)."""
    data = detect_all_dependencies()
    
    # Bổ sung check ONNX Runtime providers
    try:
        import onnxruntime
        data["onnx_providers"] = onnxruntime.get_available_providers()
    except:
        data["onnx_providers"] = ["onnxruntime not installed"]
        
    return data

from pydantic import BaseModel
import os
import shutil
import re

class DeleteProjectRequest(BaseModel):
    project_name: str
    project_path: str = ""

@router.delete("/system/project")
async def delete_project(req: DeleteProjectRequest):
    """Xóa file dự án và thư mục download liên quan trên ổ cứng."""
    def slugify(text: str) -> str:
        text = str(text).strip()
        text = re.sub(r'[^\w\s-]', '', text)
        return re.sub(r'[-\s]+', '-', text)
    
    # 1. Xóa thư mục downloads: ~/KNReup/Downloads/slugify(project_name)
    downloads_dir = os.path.join(os.path.expanduser('~'), 'KNReup', 'Downloads')
    project_slug = slugify(req.project_name)
    if project_slug:
        project_dir = os.path.join(downloads_dir, project_slug)
        if os.path.exists(project_dir):
            try:
                shutil.rmtree(project_dir)
            except Exception as e:
                print(f"Failed to delete {project_dir}: {e}")
    
    # 2. Xóa file .kn
    if req.project_path and os.path.exists(req.project_path):
        try:
            os.remove(req.project_path)
        except Exception as e:
            print(f"Failed to delete {req.project_path}: {e}")
            
    return {"status": "success", "message": "Đã xóa thư mục dự án và file", "deleted_dir": project_slug}
