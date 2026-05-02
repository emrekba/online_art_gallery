import sys

try:
    import PyPDF2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

def read_pdf(file_path):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        return text

if __name__ == '__main__':
    with open('extracted_text.txt', 'w', encoding='utf-8') as f:
        f.write(read_pdf('online_sanat_galerisi_odev.pdf'))
