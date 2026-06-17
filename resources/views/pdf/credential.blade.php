<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Credencial de Examen</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f9;
            color: #333;
        }
        .credential-card {
            width: 100%;
            max-width: 400px;
            margin: 40px auto;
            border: 2px solid #2c3e50;
            border-radius: 10px;
            background-color: #ffffff;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .header {
            background-color: #2c3e50;
            color: #ffffff;
            text-align: center;
            padding: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            text-transform: uppercase;
        }
        .header p {
            margin: 5px 0 0;
            font-size: 12px;
            opacity: 0.8;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .content h2 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 18px;
        }
        .qr-container {
            margin: 20px 0;
            text-align: center;
        }
        .qr-container img {
            border: 4px solid #eee;
        }
        .qr-label {
            font-size: 10px;
            color: #999;
            margin-top: 5px;
        }
        .postulant-info {
            margin-top: 15px;
            text-align: left;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        .info-row {
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-row strong {
            display: inline-block;
            width: 90px;
            color: #2c3e50;
        }
        .footer {
            background-color: #f4f4f9;
            text-align: center;
            padding: 10px;
            font-size: 10px;
            color: #777;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="credential-card">
        <div class="header">
            <h1>CUP - FICCT</h1>
            <p>Curso Pre-Universitario UAGRM</p>
        </div>
        
        <div class="content">
            <h2>Credencial de Examen</h2>
            
            <div class="qr-container">
                @if($qrBase64)
                    <img src="{{ $qrBase64 }}" alt="Código QR" width="180" height="180" />
                    <p class="qr-label">Escanee este código para verificar la identidad del postulante</p>
                @else
                    <p style="color: #cc0000; font-size: 12px;">[Error al generar el código QR]</p>
                @endif
            </div>

            <div class="postulant-info">
                <div class="info-row">
                    <strong>Nombres:</strong> {{ $postulant->nombres }}
                </div>
                <div class="info-row">
                    <strong>Apellidos:</strong> {{ $postulant->apellidos }}
                </div>
                <div class="info-row">
                    <strong>C.I.:</strong> {{ $postulant->ci }}
                </div>
                <div class="info-row">
                    <strong>Carrera:</strong> {{ $postulant->carreraOpcion1 ? $postulant->carreraOpcion1->name : 'N/A' }}
                </div>
            </div>
        </div>

        <div class="footer">
            Este documento es personal e intransferible. Debe presentarlo impreso o en digital el día del examen junto con su Cédula de Identidad original.
        </div>
    </div>
</body>
</html>
