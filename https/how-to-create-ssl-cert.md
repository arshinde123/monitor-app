
#### create SSL certificate to support https.

##### Steps to create SSL certificate:

1) mkdir https
2) cd https
3) enter following command:
    ```
    openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem 
    ```
4) answer the questions
5) your SSL cert is ready