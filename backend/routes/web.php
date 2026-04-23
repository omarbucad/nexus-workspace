<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function(){
    return "HELLO WORLD";
});

Route::get('/dashboard', function () {
    return inertia('welcome');
});
