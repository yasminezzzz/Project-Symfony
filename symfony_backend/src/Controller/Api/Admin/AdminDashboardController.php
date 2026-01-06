<?php

namespace App\Controller\Api\Admin;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminDashboardController extends AbstractController
{
    #[Route('/dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {


        return new JsonResponse([
            'message' => 'Welcome Admin 👑'
        ]);
    }
}
