import time
import sys
import shutil
import os


FILE = '/home/teiszler/iD/dist/data/simtime.json'
JSON = '{ "time": {} }'

def main():
    elapsed = 0
    with open(FILE, 'w') as f:
        while elapsed < 300:
            f.seek(0)
            f.write('{ "time": ')
            f.write(str(elapsed))
            f.write(' }')
            f.flush()
            elapsed += 1
            time.sleep(1)

if __name__ == '__main__':
    main()



