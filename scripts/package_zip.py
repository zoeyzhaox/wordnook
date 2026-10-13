"""Create a portable Mac ZIP without following framework symlinks."""
from pathlib import Path
import os
import stat
import sys
import zipfile

def package(app, target):
    app, target = Path(app), Path(target)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for base, dirs, files in os.walk(app, followlinks=False):
            for name in dirs[:] + files:
                path = Path(base) / name
                relative = str(path.relative_to(app.parent))
                if path.is_symlink():
                    info = zipfile.ZipInfo(relative)
                    info.create_system = 3
                    info.external_attr = (stat.S_IFLNK | 0o777) << 16
                    archive.writestr(info, os.readlink(path))
                    if name in dirs:
                        dirs.remove(name)
                else:
                    archive.write(path, relative)
    with zipfile.ZipFile(target) as archive:
        assert f'{app.name}/Contents/Resources/app.asar' in archive.namelist()
        assert archive.getinfo(f'{app.name}/Contents/MacOS/Wordnook').external_attr >> 16 & 0o111
    print(f'{target}: {target.stat().st_size:,} bytes', flush=True)

if __name__ == '__main__':
    package(sys.argv[1], sys.argv[2])
