<?php

namespace App\Controller\Api;

use App\Entity\Subject;
use App\Entity\Test;
use App\Entity\Question;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class TestController extends AbstractController
{
    // 1. Get all subjects
    #[Route('/subjects', name: 'api_subjects', methods: ['GET'])]
    public function getSubjects(EntityManagerInterface $em): JsonResponse
    {
        $subjects = $em->getRepository(Subject::class)->findAll();
        $data = array_map(fn($s) => ['id' => $s->getId(), 'name' => $s->getName()], $subjects);
        return new JsonResponse($data);
    }

    // 2. Create test with questions
    #[Route('/tests', name: 'api_create_test', methods: ['POST'])]
    public function createTest(Request $request, EntityManagerInterface $em, UserRepository $userRepo): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $student = $userRepo->find($data['student_id']);
        $subject = $em->getRepository(Subject::class)->find($data['subject_id']);
        if (!$student || !$subject) return new JsonResponse(['error' => 'Invalid student or subject'], 400);

        $test = new Test();
        $test->setStudent($student);
        $test->setSubject($subject);
        $test->setScore($data['score'] ?? 0);

        // Add questions
        foreach ($data['questions'] as $qContent) {
            $question = new Question();
            $question->setContent($qContent);
            $question->setTest($test);
            $em->persist($question);
        }

        $em->persist($test);
        $em->flush();

        return new JsonResponse(['success' => 'Test created', 'test_id' => $test->getId()]);
    }
}
