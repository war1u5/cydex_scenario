FROM debian:bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssh-server sudo && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/run/sshd

ARG USERNAME=anca.rus
ARG PASSWORD=devpass
RUN useradd -m -s /bin/bash "$USERNAME" && \
    echo "$USERNAME:$PASSWORD" | chpasswd && \
    usermod -aG sudo "$USERNAME"

RUN sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/^#\?UsePAM .*/UsePAM yes/' /etc/ssh/sshd_config && \
    sed -i 's/^#\?X11Forwarding .*/X11Forwarding no/' /etc/ssh/sshd_config

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
