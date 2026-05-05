# Imagen mínima de Nginx que sirve los archivos estáticos del cliente.
# Todo el código vive en este repo; docker-compose monta este servicio en
# el puerto 4567 del host por defecto.
FROM nginx:alpine

# Limpiamos el index de bienvenida que trae Nginx.
RUN rm -rf /usr/share/nginx/html/*

# Copiamos los archivos estáticos del frontend.
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/

# Configuración propia: gzip y cabecera para que la SPA siempre devuelva index.html.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
