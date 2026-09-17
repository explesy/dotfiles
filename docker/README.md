# Docker Setup

Справочник по установке и настройке Docker окружения на macOS и Linux.

## macOS (Рекомендуемые варианты)

### Вариант 1: OrbStack (Быстрый, легковесный)

```sh
brew install --cask orbstack
```

### Вариант 2: Docker Desktop

```sh
brew install --cask docker
```

CLI-утилиты будут доступны в `/Users/doc/.docker/bin` (путь автоматически добавляется в Fish).

### Вариант 3: Colima (Open-source CLI контейнеризация)

```sh
brew install colima docker docker-compose
colima start
```

## Linux (Arch / Manjaro)

```sh
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Дополнительная информация: [Docker Engine Post-Install](https://docs.docker.com/engine/install/linux-postinstall/).
