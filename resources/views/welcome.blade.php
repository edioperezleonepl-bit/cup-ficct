<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>CUP FICCT - Admisión Universitaria</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Estilos de Base -->
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #030712; /* Slate 950 */
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Outfit', sans-serif;
        }
    </style>

    <!-- Vite Hot Reload & Compilación -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="h-full antialiased text-slate-100 selection:bg-indigo-500 selection:text-white">
    <!-- Div Raíz donde se monta React -->
    <div id="app" class="min-h-screen flex flex-col"></div>
</body>
</html>
