import argostranslate.package

def install_all():
    print("Updating package index...")
    argostranslate.package.update_package_index()
    available = argostranslate.package.get_available_packages()

    langs = ['zh', 'ja', 'ko', 'fr']
    for code in langs:
        # Check pivot to english
        pkg = next(filter(lambda x: x.from_code == code and x.to_code == 'en', available), None)
        if pkg:
            print(f"Downloading {code} -> en ...")
            argostranslate.package.install_from_path(pkg.download())
            print(f"OK {code} -> en")
        else:
            # direct to vi
            pkg_vi = next(filter(lambda x: x.from_code == code and x.to_code == 'vi', available), None)
            if pkg_vi:
                argostranslate.package.install_from_path(pkg_vi.download())
                print(f"OK {code} -> vi")
            else:
                print(f"Not found for {code}")
                
    print("All additional languages installed!")

if __name__ == "__main__":
    install_all()
