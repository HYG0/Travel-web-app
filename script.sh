#!/bin/bash
sudo apt update

sudo apt install -y nodejs npm

node -v
npm -v

sudo apt install -y make

make --version

echo "Установка завершена"