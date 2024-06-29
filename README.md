# Lightshow

A ray tracer built on OpenGL.

## Installation Instructions for C Dependencies

- For Ubuntu or Debian, run the following.  
`sudo apt-get install libx11-dev libxcursor-dev libxrandr-dev libxinerama-dev libxi-dev libxxf86vm-dev pkg-config`

- For Fedora:  
`sudo dnf install libX11-devel libXcursor-devel libXrandr-devel libXinerama-devel libXi-devel libXxf86vm-devel pkgconf-pkg-config`

- For CentOS or RHEL:
    - Install the EPEL repository if not already enabled:  
`sudo yum install epel-release`
    - Install the required development libraries:  
    `sudo yum install libX11-devel libXcursor-devel libXrandr-devel libXinerama-devel libXi-devel libXxf86vm-devel pkgconfig`

- For Arch Linux:  
`sudo pacman -S libx11 libxcursor libxrandr libxinerama libxi libxxf86vm pkgconf`


### Summary of Required Packages
- `libx11-dev` / `libX11-devel` / `libx11`: X11 development files
- `libxcursor-dev` / `libXcursor-devel` / `libxcursor`: Xcursor development files
- `libxrandr-dev` / `libXrandr-devel` / `libxrandr`: Xrandr development files
- `libxinerama-dev` / `libXinerama-devel` / `libxinerama`: Xinerama development files
- `libxi-dev` / `libXi-devel` / `libxi`: XInput2 development files
- `libxxf86vm-dev` / `libXxf86vm-devel` / `libxxf86vm`: XFree86-VidModeExtension development files
- `pkg-config` / `pkgconf-pkg-config` / `pkgconfig` / `pkgconf`: Tool for managing compile and link flags for libraries.

