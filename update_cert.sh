#!/bin/bash

if [[ $(/usr/bin/id -u) -ne 0 ]]; then
    echo "Not running as root. Use sudo."
    exit
fi


certbot certonly --standalone -n --domains $1

cp /etc/letsencrypt/live/$1/cert.pem /home/$SUDO_USER/.lvwebserver/cert.pem
cp /etc/letsencrypt/live/$1/privkey.pem /home/$SUDO_USER/.lvwebserver/privkey.pem