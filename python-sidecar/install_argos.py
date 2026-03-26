import argostranslate.package
import argostranslate.translate

def install_vi():
    print("Updating package index...")
    argostranslate.package.update_package_index()
    print("Finding English -> Vietnamese package...")
    available_packages = argostranslate.package.get_available_packages()
    package_to_install = next(
        filter(
            lambda x: x.from_code == 'en' and x.to_code == 'vi', available_packages
        ), None
    )
    if package_to_install:
        print("Downloading and installing EN->VI model...")
        argostranslate.package.install_from_path(package_to_install.download())
        print("OK! Đã cài bộ dịch Argos EN-VI thành công.")
    else:
        print("Error: Package EN->VI not found!")

if __name__ == "__main__":
    install_vi()
