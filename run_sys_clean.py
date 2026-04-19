import sys
sys.path.append('./booster_app_export')
import main
print(main.clean_system())
print(main.clean_shader_caches())
print(main.full_system_clean(True))
