#!/usr/bin/env python3
"""构建单文件版（双击即用，仅 KaTeX CSS 走 CDN）。
用法: python build-standalone.py [源文件名]   默认 index.html → md-reader-standalone.html
"""
import pathlib, re, sys

proto = pathlib.Path(__file__).resolve().parent.parent / "prototype"
src_name = sys.argv[1] if len(sys.argv) > 1 else "index.html"
dst_name = ("md-reader-standalone.html" if src_name == "index.html"
            else src_name.replace(".html", "-standalone.html"))
html = (proto / src_name).read_text(encoding="utf-8")

# 1) 抽出 module 应用脚本，改写本地 bundle import，包 async IIFE
m = re.search(r'<script type="module">(.*?)</script>\s*</body>', html, re.S)
assert m, "module script not found"
app_js = m.group(1)
html_no_module = html.replace(m.group(0), "</body>")

def css_repl(mm):
    tag, href = mm.group(0), mm.group(1)
    if "katex" in href:
        return tag
    style = "<style>" + (proto / href).read_text(encoding="utf-8") + "</style>"
    idm = re.search(r'id="([^"]+)"', tag)
    if idm:  # 保留 id，让 JS 的主题开关能找到暗色样式表
        style = style.replace("<style>", f'<style id="{idm.group(1)}">')
    return style

html_no_module = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css_repl, html_no_module)

app_cjs = app_js.replace("import('./vendor/crepe.bundle.mjs')", "mdrCrepeLib")
app_wrapped = "(async () => {\n" + app_cjs + "\n})();"

iife = (proto / "vendor" / "crepe.iife.js").read_text(encoding="utf-8")

# 2) 安全校验：脚本内容不得包含 </script
for name, code in [("iife", iife), ("app", app_wrapped)]:
    assert not re.findall(r"</script", code, re.I), f"{name} contains </script!"

single = html_no_module.replace(
    "</body>",
    '<script>' + iife + '</script>\n<script>' + app_wrapped + '</script>\n</body>'
)
out = proto / dst_name
out.write_text(single, encoding="utf-8")
print(f"written {out} ({out.stat().st_size/1024/1024:.1f} MB)")
print("stylesheets kept:", re.findall(r'rel="stylesheet" href="([^"]+)"', single))
