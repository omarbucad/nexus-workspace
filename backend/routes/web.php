<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function(){
    return inertia('test');
});

Route::get('/dashboard', function () {
    return inertia('welcome');
});
