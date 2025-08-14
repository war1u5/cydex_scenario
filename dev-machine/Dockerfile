FROM debian:bullseye

RUN apt-get update && \
    apt-get install -y openssh-server sudo curl vim net-tools iputils-ping nmap && \
    mkdir /var/run/sshd

RUN useradd -m dev && echo "dev:devpass" | chpasswd && adduser dev sudo

RUN sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]
